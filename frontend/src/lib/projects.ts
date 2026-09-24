export function deleteEmptyProject(
  projects: string[],
  tasks: Array<{ project: string }>,
  name: string,
): string[] {
  if (!projects.includes(name) || tasks.some((task) => task.project === name)) return projects
  return projects.filter((project) => project !== name)
}
