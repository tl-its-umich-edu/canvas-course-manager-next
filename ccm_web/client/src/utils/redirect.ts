type RedirectRoute = '/'

export default function redirect (route: RedirectRoute): void {
  location.href = route
}
