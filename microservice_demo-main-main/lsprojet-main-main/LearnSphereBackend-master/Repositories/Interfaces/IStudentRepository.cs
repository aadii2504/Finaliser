using MyProject.Api.Models;

namespace MyProject.Api.Repositories.Interfaces;

public interface IStudentRepository
{
	Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct);

	// ✅ add this (tracked entity for updates)
	Task<Student?> GetByUserIdTrackedAsync(Guid userId, CancellationToken ct);

	Task AddAsync(Student student, CancellationToken ct);
	Task SaveChangesAsync(CancellationToken ct);
}
