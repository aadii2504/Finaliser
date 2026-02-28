
// components/admin/courses/validators.js
export const validateCourse = (form) => {
  const errors = {};
  if (!form.title?.trim()) errors.title = "Title is required.";
  if (!form.slug?.trim()) errors.slug = "Slug is required.";
  if (!form.summary?.trim())
    errors.summary = "Summary is required.";
  if ((form.description || "").length < 20) {
    errors.description = "Description looks too short.";
  }
  return errors;
};
``
