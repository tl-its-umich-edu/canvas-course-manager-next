type RedirectRoute = '/' | '/canvas/redirectOAuth'

export default function redirect (route: RedirectRoute): void {
  location.href = route
}
