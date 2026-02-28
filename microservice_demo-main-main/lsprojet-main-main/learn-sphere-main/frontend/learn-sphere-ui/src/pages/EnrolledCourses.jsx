import React, { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, unenrollCourse } from "../components/EnrollmentStore";

export default function EnrolledCourses() {
  const enrolled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6" style={{ color: "var(--text)" }}>
      <h1 className="text-2xl font-bold">Enrolled Courses</h1>

      {enrolled.length === 0 ? (
        <div
          className="mt-6 rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <p className="opacity-80">You haven’t enrolled in any courses yet.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolled.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <div
                className="h-32 w-full bg-center bg-cover"
                style={{
                  backgroundImage: `url('${c.thumbnail || "/assets/placeholder.jpg"}')`,
                }}
                aria-label={c.title}
              />
              <div className="p-4">
                <h3 className="text-sm font-bold">{c.title}</h3>
                {c.level && <p className="mt-1 text-sm opacity-80">{c.level}</p>}
                {c.lessons != null && (
                  <p className="mt-1 text-sm opacity-70">{c.lessons} lessons</p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={`/course/${c.slug}`}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-white
                               bg-gradient-to-tr from-indigo-600 to-blue-500 shadow hover:shadow-md transition"
                  >
                    Go to Course
                  </a>

                  <button
                    onClick={() => unenrollCourse(c.id)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold border transition"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--card)",
                      color: "var(--text)",
                    }}
                    aria-label={`Unenroll ${c.title}`}
                  >
                    Unenroll
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
