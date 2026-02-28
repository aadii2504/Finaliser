using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/students")]
public class StudentsController : ControllerBase
{
	private readonly IStudentRepository _students;
	private readonly IEnrollmentRepository _enrollments;

	public StudentsController(IStudentRepository students, IEnrollmentRepository enrollments)
	{
		_students = students;
		_enrollments = enrollments;
	}

	[Authorize]
	[HttpGet("me")]
	public async Task<ActionResult<StudentMeResponseDto>> GetMe(CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var s = await _students.GetByUserIdAsync(userId, ct);
		if (s is null) return NotFound("Student profile not found");

		return Ok(ToMeDto(s));
	}

	// ✅ NEW: Upsert profile for current user
	[Authorize]
	[HttpPost("me")]
	public async Task<ActionResult<StudentMeResponseDto>> UpsertMe(
		[FromBody] StudentMeUpsertRequestDto req,
		CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var s = await _students.GetByUserIdTrackedAsync(userId, ct);

		if (s is null)
		{
			// create if missing
			s = new Student
			{
				UserId = userId,
				FullName = req.FullName ?? "",
				Email = req.Email ?? ""
			};

			await _students.AddAsync(s, ct);
		}

		// Update only non-null fields
		if (req.FullName is not null) s.FullName = req.FullName;
		if (req.DateOfBirth is not null) s.DateOfBirth = req.DateOfBirth;
		if (req.Gender is not null) s.Gender = req.Gender;
		if (req.Email is not null) s.Email = req.Email;
		if (req.Country is not null) s.Country = req.Country;
		if (req.Phone is not null) s.Phone = req.Phone;

		if (req.RollNumber is not null) s.RollNumber = req.RollNumber;
		if (req.Course is not null) s.Course = req.Course;
		if (req.Year is not null) s.Year = req.Year;

		if (req.GuardianName is not null) s.GuardianName = req.GuardianName;
		if (req.GuardianPhone is not null) s.GuardianPhone = req.GuardianPhone;
		if (req.GuardianEmail is not null) s.GuardianEmail = req.GuardianEmail;
		if (req.GuardianAddress is not null) s.GuardianAddress = req.GuardianAddress;

		await _students.SaveChangesAsync(ct);

		return Ok(ToMeDto(s));
	}

	private static StudentMeResponseDto ToMeDto(Student s) => new()
	{
		FullName = s.FullName,
		DateOfBirth = s.DateOfBirth,
		Gender = s.Gender,
		Email = s.Email,
		Country = s.Country,
		Phone = s.Phone,
		RollNumber = s.RollNumber,
		Course = s.Course,
		Year = s.Year,
		GuardianName = s.GuardianName,
		GuardianPhone = s.GuardianPhone,
		GuardianEmail = s.GuardianEmail,
		GuardianAddress = s.GuardianAddress
	};

	// ✅ NEW: Enroll in a course
	[Authorize]
	[HttpPost("me/enroll")]
	public async Task<ActionResult<CourseDto>> EnrollInCourse(
		[FromBody] EnrollmentRequestDto req,
		CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var student = await _students.GetByUserIdAsync(userId, ct);
		if (student is null)
			return NotFound("Student profile not found");

		// Check if already enrolled
		var existing = await _enrollments.GetByStudentAndCourseAsync(student.Id, req.CourseId);
		if (existing is not null)
			return BadRequest("Already enrolled in this course");

		var enrollment = new Enrollment
		{
			StudentId = student.Id,
			CourseId = req.CourseId,
			Status = "active"
		};

		await _enrollments.AddAsync(enrollment);

		return Ok(new { message = "Enrolled successfully" });
	}

	// ✅ NEW: Get enrolled courses for current student
	[Authorize]
	[HttpGet("me/courses")]
	public async Task<ActionResult<List<CourseDto>>> GetEnrolledCourses(CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var student = await _students.GetByUserIdAsync(userId, ct);
		if (student is null)
			return NotFound("Student profile not found");

		var courses = await _enrollments.GetStudentCoursesAsync(student.Id);
		var courseDtos = courses.Select(c => new CourseDto
		{
			Id = c.Id,
			Title = c.Title,
			Slug = c.Slug,
			Summary = c.Summary,
			Description = c.Description,
			Thumbnail = c.Thumbnail,
			Categories = c.Categories,
			Duration = c.Duration,
			Level = c.Level,
			Price = c.Price,
			Status = c.Status
		}).ToList();

		return Ok(courseDtos);
	}

	// ✅ NEW: Unenroll from a course
	[Authorize]
	[HttpDelete("me/courses/{courseId}")]
	public async Task<ActionResult> UnenrollFromCourse(int courseId, CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var student = await _students.GetByUserIdAsync(userId, ct);
		if (student is null)
			return NotFound("Student profile not found");

		var enrollment = await _enrollments.GetByStudentAndCourseAsync(student.Id, courseId);
		if (enrollment is null)
			return NotFound("Enrollment not found");

		await _enrollments.RemoveAsync(enrollment);
		return Ok(new { message = "Unenrolled successfully" });
	}
}
