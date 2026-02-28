using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Repositories;

public class StudentRepository : IStudentRepository
{
	private readonly AppDbContext _db;

	public StudentRepository(AppDbContext db) => _db = db;

	public Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct) =>
		_db.Students.AsNoTracking()
			.FirstOrDefaultAsync(s => s.UserId == userId, ct);

	// ✅ tracked version for updates
	public Task<Student?> GetByUserIdTrackedAsync(Guid userId, CancellationToken ct) =>
		_db.Students
			.FirstOrDefaultAsync(s => s.UserId == userId, ct);

	public Task AddAsync(Student student, CancellationToken ct) =>
		_db.Students.AddAsync(student, ct).AsTask();

	public Task SaveChangesAsync(CancellationToken ct) =>
		_db.SaveChangesAsync(ct);
}