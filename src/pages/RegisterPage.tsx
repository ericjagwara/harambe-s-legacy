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
            ? 'Support the pipeline without running. Give any amount by mobile money or Visa card, shown on the donor board with your name or anonymously.'
            : 'Run, donate, sponsor, exhibit or volunteer. Runners and donors pay online. Sponsors, exhibitors and volunteers send their details and our team follows up.'
        }
      />
      <Registration initialTab={initialTab} />
    </>
  )
}
