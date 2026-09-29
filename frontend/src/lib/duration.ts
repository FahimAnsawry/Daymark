/** 200 minutes as "3h 20m". */
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? (rest ? `${hours}h ${rest}m` : `${hours}h`) : `${rest}m`
}
