type RedirectRoute = '/' | '/access-denied'

export default function redirect (route: RedirectRoute): void {
  location.href = route
}
