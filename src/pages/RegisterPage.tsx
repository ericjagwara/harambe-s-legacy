import Registration, { type RegistrationTab } from '../sections/Registration'

const OPTIONS: RegistrationTab[] = ['run', 'donate', 'sponsor', 'booth']

type RegisterPageProps = {
  donate?: boolean
}

// The form's own "What would you like to do?" question is the page heading.
// /register starts on "Select an option"; /register?for=run preselects an option (used by "Register to run" links);
// /donate opens with Donate already chosen.
export default function RegisterPage({ donate = false }: RegisterPageProps) {
  const wanted = new URLSearchParams(window.location.search).get('for') as RegistrationTab | null
  // Volunteering has its own page; old ?for=volunteer links go there.
  if ((wanted as string) === 'volunteer') window.location.replace('/volunteer')
  const preset = wanted && OPTIONS.includes(wanted) ? wanted : ''
  return <Registration initialTab={donate ? 'donate' : preset} />
}
