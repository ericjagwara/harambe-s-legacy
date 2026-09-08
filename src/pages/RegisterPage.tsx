import { PageHero } from '../components/PageLayout'
import Registration, { type RegistrationTab } from '../sections/Registration'

type RegisterPageProps = {
  initialTab?: RegistrationTab
  donate?: boolean
}

export default function RegisterPage({ initialTab = 'run', donate = false }: RegisterPageProps) {
  return (
    <>
      <PageHero
        eyebrow={donate ? 'Donate' : 'Participation desk'}
        title={donate ? 'Pledge support for the startup pipeline.' : 'Choose your lane. Join the run.'}
        copy={
          donate
            ? 'Support the pipeline without running. Public display can be named or anonymous, and final payment channels remain subject to TechBuzz Hub confirmation.'
            : 'One flow supports runner registration, donations, sponsorship interest, booth booking and volunteer sign-up. Student runners verify status with a valid student ID.'
        }
      />
      <Registration initialTab={initialTab} />
    </>
  )
}
