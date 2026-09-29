import Registration from '../sections/Registration'

type RegisterPageProps = {
  donate?: boolean
}

// The form's own "What would you like to do?" question is the page heading.
// /register starts on "Select an option"; /donate opens with Donate already chosen.
export default function RegisterPage({ donate = false }: RegisterPageProps) {
  return <Registration initialTab={donate ? 'donate' : ''} />
}
