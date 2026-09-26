const WHATSAPP_CONTACT_NUMBER = '256781405551'

export default function WhatsAppFloatButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/20 transition-transform duration-200 ease-out hover:scale-110 focus-visible:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-8 sm:right-8"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 fill-white">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.657 4.527 1.797 6.393L4 29l7.78-1.762A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75c-1.96 0-3.79-.55-5.348-1.5l-.383-.227-4.617 1.046 1.028-4.5-.25-.4A9.7 9.7 0 0 1 5.25 15c0-5.93 4.824-10.75 10.754-10.75S26.75 9.07 26.75 15 21.934 24.75 16.004 24.75Zm5.914-8.137c-.324-.163-1.918-.946-2.215-1.055-.297-.107-.512-.162-.727.163-.215.324-.836 1.054-1.024 1.27-.188.216-.375.244-.699.081-.324-.162-1.367-.503-2.605-1.605-.963-.858-1.613-1.918-1.801-2.242-.188-.325-.02-.5.142-.663.145-.144.324-.376.485-.564.163-.188.216-.324.324-.54.109-.216.055-.406-.027-.568-.081-.163-.727-1.749-.996-2.395-.262-.63-.528-.545-.727-.555l-.618-.011a1.187 1.187 0 0 0-.86.406c-.297.324-1.132 1.106-1.132 2.699s1.16 3.132 1.32 3.348c.163.216 2.284 3.488 5.535 4.892.774.334 1.377.534 1.847.684.776.247 1.482.212 2.04.129.622-.093 1.918-.784 2.188-1.542.27-.758.27-1.408.19-1.542-.082-.135-.297-.216-.622-.379Z" />
      </svg>
    </a>
  )
}
