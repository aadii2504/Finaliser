using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssessmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AssessmentsController(AppDbContext db) => _db = db;

    // -----------------------------------------------------------------------
    // ADMIN: Manage Assessment for a Course
    // -----------------------------------------------------------------------

    /// <summary>Get the assessment for a course (admin or student).</summary>
    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetByCourse(int courseId)
    {
        var assessment = await _db.Assessments
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.CourseId == courseId);

        if (assessment == null) return Ok(null);
        return Ok(MapAssessment(assessment));
    }

    /// <summary>Admin: Upsert assessment for a course (create or update).</summary>
    [HttpPut("course/{courseId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Upsert(int courseId, [FromBody] AssessmentUpsertDto dto)
    {
        var course = await _db.Courses.FindAsync(courseId);
        if (course == null) return NotFound("Course not found.");

        var existing = await _db.Assessments
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.CourseId == courseId);

        if (existing == null)
        {
            existing = new Assessment { CourseId = courseId };
            _db.Assessments.Add(existing);
        }

        existing.Title = dto.Title;
        existing.Description = dto.Description;
        existing.TimeLimitMinutes = dto.TimeLimitMinutes;
        existing.PassingScorePercentage = dto.PassingScorePercentage;
        existing.MaxAttempts = dto.MaxAttempts;
        existing.AccessDurationDays = dto.AccessDurationDays;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await UpsertQuestions(existing.Id, dto.Questions ?? new List<AssessmentQuestionDto>());

        return Ok(MapAssessment(await _db.Assessments
            .Include(a => a.Questions)
            .FirstAsync(a => a.Id == existing.Id)));
    }

    /// <summary>Admin: Delete assessment for a course.</summary>
    [HttpDelete("course/{courseId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int courseId)
    {
        var assessment = await _db.Assessments.FirstOrDefaultAsync(a => a.CourseId == courseId);
        if (assessment == null) return NotFound();
        _db.Assessments.Remove(assessment);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // -----------------------------------------------------------------------
    // STUDENT: Eligibility, Start, Submit
    // -----------------------------------------------------------------------

    /// <summary>Student: Check if the assessment is unlocked for the current student.</summary>
    [HttpGet("course/{courseId}/eligibility")]
    [Authorize]
    public async Task<IActionResult> CheckEligibility(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var assessment = await _db.Assessments
            .Include(a => a.Attempts.Where(at => at.StudentId == studentId.Value))
            .FirstOrDefaultAsync(a => a.CourseId == courseId);

        if (assessment == null)
            return Ok(new { eligible = false, reason = "No assessment for this course." });

        // Check attempt limit
        var completedAttempts = assessment.Attempts.Count(a => a.Status != "Started");
        if (completedAttempts >= assessment.MaxAttempts)
            return Ok(new { eligible = false, reason = "Maximum attempts reached.", attemptsUsed = completedAttempts, maxAttempts = assessment.MaxAttempts });

        // Check if all lessons completed
        var courseChapters = await _db.Chapters
            .Where(c => c.CourseId == courseId)
            .Include(c => c.Lessons)
            .ToListAsync();

        var allLessonIds = courseChapters.SelectMany(c => c.Lessons).Select(l => l.Id).ToList();
        var completedLessonIds = await _db.LessonProgresses
            .Where(lp => lp.StudentId == studentId.Value && lp.IsCompleted && allLessonIds.Contains(lp.LessonId))
            .Select(lp => lp.LessonId)
            .Distinct()
            .ToListAsync();

        if (completedLessonIds.Count < allLessonIds.Count)
        {
            return Ok(new
            {
                eligible = false,
                reason = "Complete all lessons first.",
                lessonsCompleted = completedLessonIds.Count,
                lessonsTotal = allLessonIds.Count,
                attemptsUsed = completedAttempts,
                maxAttempts = assessment.MaxAttempts
            });
        }

        // Check if all chapter quizzes passed
        var chapterIds = courseChapters.Select(c => c.Id).ToList();
        var allQuizzes = await _db.Quizzes
            .Where(q => chapterIds.Contains(q.ChapterId))
            .ToListAsync();

        var quizIds = allQuizzes.Select(q => q.Id).ToList();
        var passedQuizAttempts = await _db.QuizAttempts
            .Where(qa => qa.StudentId == studentId.Value && qa.Passed && quizIds.Contains(qa.QuizId))
            .GroupBy(qa => qa.QuizId)
            .Select(g => g.OrderByDescending(qa => qa.AttemptedAt).First())
            .ToListAsync();

        if (passedQuizAttempts.Count < allQuizzes.Count)
        {
            return Ok(new
            {
                eligible = false,
                reason = "Pass all chapter quizzes first.",
                quizzesPassed = passedQuizAttempts.Count,
                quizzesTotal = allQuizzes.Count,
                attemptsUsed = completedAttempts,
                maxAttempts = assessment.MaxAttempts
            });
        }

        // --- DYNAMIC DUE DATE LOGIC ---
        DateTime? calculatedDueDate = null;

        if (assessment.AccessDurationDays.HasValue)
        {
            // Find completion dates for all required items
            var lpDates = await _db.LessonProgresses
                .Where(lp => lp.StudentId == studentId.Value && allLessonIds.Contains(lp.LessonId))
                .Select(lp => lp.CompletedAt)
                .ToListAsync();

            var qaDates = passedQuizAttempts.Select(qa => qa.AttemptedAt).ToList();

            var allCompletionDates = lpDates
                .Where(d => d.HasValue)
                .Select(d => d!.Value)
                .Concat(qaDates)
                .ToList();

            if (allCompletionDates.Any())
            {
                var latestCompletion = allCompletionDates.Max();
                calculatedDueDate = latestCompletion.AddDays(assessment.AccessDurationDays.Value);
            }
        }

        // FINAL CHECK FOR CALCULATED DUE DATE
        if (calculatedDueDate.HasValue && DateTime.UtcNow > calculatedDueDate.Value)
        {
            return Ok(new
            {
                eligible = false,
                reason = "Assessment access window has expired.",
                attemptsUsed = completedAttempts,
                maxAttempts = assessment.MaxAttempts,
                dueDate = calculatedDueDate
            });
        }

        // Check for an ongoing attempt
        var ongoingAttempt = assessment.Attempts.FirstOrDefault(a => a.Status == "Started");
        return Ok(new
        {
            eligible = true,
            attemptsUsed = completedAttempts,
            maxAttempts = assessment.MaxAttempts,
            timeLimitMinutes = assessment.TimeLimitMinutes,
            dueDate = calculatedDueDate,
            ongoingAttemptId = ongoingAttempt?.Id,
            ongoingStartedAt = ongoingAttempt?.StartedAt
        });
    }

    /// <summary>Student: Start an assessment attempt.</summary>
    [HttpPost("course/{courseId}/start")]
    [Authorize]
    public async Task<IActionResult> Start(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var assessment = await _db.Assessments
            .Include(a => a.Questions)
            .Include(a => a.Attempts.Where(at => at.StudentId == studentId.Value))
            .FirstOrDefaultAsync(a => a.CourseId == courseId);

        if (assessment == null) return NotFound("No assessment for this course.");

        // Guard: attempt limit (count only completed/timed-out)
        var completedAttempts = assessment.Attempts.Count(a => a.Status != "Started");
        if (completedAttempts >= assessment.MaxAttempts)
            return BadRequest($"You have used all {assessment.MaxAttempts} attempts.");

        // Reuse existing ongoing attempt or create new
        var ongoing = assessment.Attempts.FirstOrDefault(a => a.Status == "Started");
        if (ongoing == null)
        {
            ongoing = new AssessmentAttempt
            {
                StudentId = studentId.Value,
                AssessmentId = assessment.Id,
                AttemptNumber = completedAttempts + 1,
                Status = "Started",
            };
            _db.AssessmentAttempts.Add(ongoing);
            await _db.SaveChangesAsync();
        }

        // Return questions WITHOUT correct answers
        var questions = assessment.Questions.OrderBy(q => q.Order).Select(q => new
        {
            q.Id,
            q.Text,
            q.Type,
            Options = SafeDeserialize<List<string>>(q.Options),
            q.Order
        });

        return Ok(new
        {
            attemptId = ongoing.Id,
            startedAt = ongoing.StartedAt,
            timeLimitMinutes = assessment.TimeLimitMinutes,
            questions
        });
    }

    /// <summary>Student: Submit assessment answers.</summary>
    [HttpPost("attempt/{attemptId}/submit")]
    [Authorize]
    public async Task<IActionResult> Submit(int attemptId, [FromBody] AssessmentSubmitDto dto)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        if (dto == null || dto.Answers == null) return BadRequest("Answers are required.");

        var attempt = await _db.AssessmentAttempts
            .Include(a => a.Assessment)
                .ThenInclude(a => a!.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.StudentId == studentId.Value);

        if (attempt == null) return NotFound("Attempt not found.");
        if (attempt.Status != "Started") return BadRequest("This attempt is already completed.");

        var assessment = attempt.Assessment!;

        // Auto-fail if past time limit
        var elapsed = DateTime.UtcNow - attempt.StartedAt;
        if (elapsed.TotalMinutes > assessment.TimeLimitMinutes + 1) // 1 min grace
        {
            attempt.Status = "TimedOut";
            attempt.Score = 0;
            attempt.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { score = 0, passed = false, reason = "Time expired." });
        }

        int correct = 0;
        int total = assessment.Questions.Count;
        foreach (var question in assessment.Questions)
        {
            var correctIndices = JsonSerializer.Deserialize<List<int>>(question.CorrectIndices) ?? new List<int>();

            if (question.Type == "MCQ")
            {
                if (dto.Answers.TryGetValue(question.Id, out var selected) &&
                    selected is JsonElement el &&
                    el.ValueKind == JsonValueKind.Number &&
                    correctIndices.Contains(el.GetInt32()))
                    correct++;
            }
            else // MultipleSelect
            {
                if (dto.Answers.TryGetValue(question.Id, out var selected) &&
                    selected is JsonElement multiEl &&
                    multiEl.ValueKind == JsonValueKind.Array)
                {
                    var selectedList = multiEl.EnumerateArray().Select(e => e.GetInt32()).OrderBy(x => x).ToList();
                    var sortedCorrect = correctIndices.OrderBy(x => x).ToList();
                    if (selectedList.SequenceEqual(sortedCorrect)) correct++;
                }
            }
        }

        float score = total > 0 ? (float)correct / total * 100f : 0;
        bool passed = score >= assessment.PassingScorePercentage;

        attempt.Score = score;
        attempt.Passed = passed;
        attempt.Status = "Completed";
        attempt.CompletedAt = DateTime.UtcNow;

        // Update Enrollment
        var enrollment = await _db.Enrollments.FirstOrDefaultAsync(e => e.CourseId == assessment.CourseId && e.StudentId == studentId.Value);
        if (enrollment != null)
        {
            // Always update highest score if multiple attempts
            if (enrollment.Score == null || score > enrollment.Score)
            {
                enrollment.Score = score;
                enrollment.Grade = score >= 90 ? "A" : score >= 80 ? "B" : "C";
            }
            
            // Set attendance date when completed
            enrollment.Attendance = DateTime.UtcNow.ToString("yyyy-MM-dd");
            
            if (passed)
            {
                enrollment.CompletedAt = DateTime.UtcNow;
                enrollment.Status = "completed";
                
                // Calculate due date (same logic as CheckEligibility)
                DateTime? calculatedDueDate = null;
                if (assessment.AccessDurationDays.HasValue)
                {
                    var courseChapters = await _db.Chapters.Where(c => c.CourseId == assessment.CourseId).Include(c => c.Lessons).ToListAsync();
                    var allLessonIds = courseChapters.SelectMany(c => c.Lessons).Select(l => l.Id).ToList();
                    var lpDates = await _db.LessonProgresses.Where(lp => lp.StudentId == studentId.Value && allLessonIds.Contains(lp.LessonId)).Select(lp => lp.CompletedAt).ToListAsync();
                    var allQuizzes = await _db.Quizzes.Where(q => courseChapters.Select(c => c.Id).Contains(q.ChapterId)).ToListAsync();
                    var quizIds = allQuizzes.Select(q => q.Id).ToList();
                    var passedQuizAttempts = await _db.QuizAttempts.Where(qa => qa.StudentId == studentId.Value && qa.Passed && quizIds.Contains(qa.QuizId)).GroupBy(qa => qa.QuizId).Select(g => g.OrderByDescending(qa => qa.AttemptedAt).First()).ToListAsync();
                    var qaDates = passedQuizAttempts.Select(qa => qa.AttemptedAt).ToList();
                    var allCompletionDates = lpDates.Where(d => d.HasValue).Select(d => d!.Value).Concat(qaDates).ToList();
                    if (allCompletionDates.Any())
                    {
                        var latestCompletion = allCompletionDates.Max();
                        calculatedDueDate = latestCompletion.AddDays(assessment.AccessDurationDays.Value);
                    }
                }

                if (calculatedDueDate.HasValue)
                {
                    enrollment.Compliance = DateTime.UtcNow <= calculatedDueDate.Value ? "Compliant" : "Non-Compliant";
                }
                else
                {
                    enrollment.Compliance = "Compliant";
                }
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            score,
            passed,
            correct,
            total,
            passingScore = assessment.PassingScorePercentage,
            attemptsUsed = await _db.AssessmentAttempts.CountAsync(a => a.AssessmentId == assessment.Id && a.StudentId == studentId.Value && a.Status != "Started"),
            maxAttempts = assessment.MaxAttempts
        });
    }

    /// <summary>Student: Get my assessment attempts for a course.</summary>
    [HttpGet("course/{courseId}/my-attempts")]
    [Authorize]
    public async Task<IActionResult> GetMyAttempts(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var assessment = await _db.Assessments.FirstOrDefaultAsync(a => a.CourseId == courseId);
        if (assessment == null) return Ok(new List<object>());

        var attempts = await _db.AssessmentAttempts
            .Where(a => a.AssessmentId == assessment.Id && a.StudentId == studentId.Value)
            .OrderBy(a => a.AttemptNumber)
            .Select(a => new { a.Id, a.AttemptNumber, a.Score, a.Passed, a.Status, a.StartedAt, a.CompletedAt })
            .ToListAsync();

        return Ok(attempts);
    }

    // -----------------------------------------------------------------------
    // STUDENT: Lesson Progress
    // -----------------------------------------------------------------------

    /// <summary>Student: Mark a lesson as completed.</summary>
    [HttpPost("lesson/{lessonId}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteLesson(int lessonId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var existing = await _db.LessonProgresses
            .FirstOrDefaultAsync(lp => lp.StudentId == studentId.Value && lp.LessonId == lessonId);

        if (existing == null)
        {
            _db.LessonProgresses.Add(new LessonProgress
            {
                StudentId = studentId.Value,
                LessonId = lessonId,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.IsCompleted = true;
            existing.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { lessonId, completed = true });
    }

    /// <summary>Student: Get completed lesson ids for a course.</summary>
    [HttpGet("course/{courseId}/progress")]
    [Authorize]
    public async Task<IActionResult> GetProgress(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var allLessonIds = await _db.Chapters
            .Where(c => c.CourseId == courseId)
            .SelectMany(c => c.Lessons.Select(l => l.Id))
            .ToListAsync();

        var completedIds = await _db.LessonProgresses
            .Where(lp => lp.StudentId == studentId.Value && lp.IsCompleted && allLessonIds.Contains(lp.LessonId))
            .Select(lp => lp.LessonId)
            .ToListAsync();

        var passedQuizIds = await _db.QuizAttempts
            .Where(qa => qa.StudentId == studentId.Value && qa.Passed)
            .Select(qa => qa.QuizId)
            .Distinct()
            .ToListAsync();

        return Ok(new
        {
            completedLessonIds = completedIds,
            passedQuizIds,
            totalLessons = allLessonIds.Count
        });
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private async Task<Guid?> GetStudentIdAsync()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(claim, out var userId)) return null;

        var student = await _db.Students.FirstOrDefaultAsync(s => s.UserId == userId);
        return student?.Id;
    }

    private async Task UpsertQuestions(int assessmentId, List<AssessmentQuestionDto> questions)
    {
        var existing = await _db.AssessmentQuestions.Where(q => q.AssessmentId == assessmentId).ToListAsync();
        _db.AssessmentQuestions.RemoveRange(existing);

        for (int i = 0; i < questions.Count; i++)
        {
            var q = questions[i];
            _db.AssessmentQuestions.Add(new AssessmentQuestion
            {
                AssessmentId = assessmentId,
                Text = q.Text,
                Type = q.Type ?? "MCQ",
                Options = JsonSerializer.Serialize(q.Options),
                CorrectIndices = JsonSerializer.Serialize(q.CorrectIndices),
                Order = i,
            });
        }
        await _db.SaveChangesAsync();
    }

    private object MapAssessment(Assessment a) => new
    {
        a.Id,
        a.CourseId,
        a.Title,
        a.Description,
        a.TimeLimitMinutes,
        a.PassingScorePercentage,
        a.MaxAttempts,
        a.AccessDurationDays,
        a.CreatedAt,
        a.UpdatedAt,
        Questions = a.Questions.OrderBy(q => q.Order).Select(q => new
        {
            q.Id,
            q.Text,
            q.Type,
            Options = SafeDeserialize<List<string>>(q.Options),
            CorrectIndices = SafeDeserialize<List<int>>(q.CorrectIndices),
            q.Order
        })
    };

    private static T SafeDeserialize<T>(string? json) where T : new()
    {
        if (string.IsNullOrWhiteSpace(json)) return new T();
        try { return JsonSerializer.Deserialize<T>(json) ?? new T(); }
        catch { return new T(); }
    }
}

// -----------------------------------------------------------------------
// DTOs
// -----------------------------------------------------------------------

public record AssessmentUpsertDto(
    string Title,
    string? Description,
    int TimeLimitMinutes,
    int PassingScorePercentage,
    int MaxAttempts,
    int? AccessDurationDays,
    List<AssessmentQuestionDto>? Questions
);

public record AssessmentQuestionDto(
    string Text,
    string? Type,
    List<string> Options,
    List<int> CorrectIndices
);

public class AssessmentSubmitDto
{
    public Dictionary<int, object> Answers { get; set; } = new();
}
