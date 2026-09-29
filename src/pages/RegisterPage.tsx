import Registration, { type RegistrationTab } from '../sections/Registration'

type RegisterPageProps = {
  initialTab?: RegistrationTab
  donate?: boolean
}

// The form's own "What would you like to do?" question is the page heading.
export default function RegisterPage({ initialTab = 'run', donate = false }: RegisterPageProps) {
  return <Registration initialTab={donate ? 'donate' : initialTab} />
}
