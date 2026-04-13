import Foundation
import SwiftUI

/// All translatable strings. Keys mirror `LANG.en` / `LANG.es` in `src/App.jsx:66-253`.
enum LangKey: String {
    // Nav
    case home, nominate, volunteer, admin, portal
    // Landing
    case sponsorBtn, nominateBtn, volunteerBtn
    // Nomination form
    case nomFormTitle, nomFormSubtitle, nomFormConfidential
    case childInfoTitle, firstName, lastName
    case studentId, studentIdPlaceholder
    case school, selectSchool, grade, gradeLabel, gradeNote
    case yourInfoTitle, yourName, fullName, role, email
    case parentGuardianTitle, parentName, parentPhone, parentEmail
    case preferredLang, langNote
    case detailsTitle, whyNominate, reasonPlaceholder
    case siblingsQuestion, howManySiblings, none
    case siblingLabel, siblingName, siblingStudentId, siblingNote, siblingNote2
    case submitNomination, submitting
    case nomSuccess, nomSuccessMsg, nominateAnother
    // Intake
    case intakeTitle, intakeSubtitle, intakeConfidential
    case aboutTitle, clothingSizes
    case genderLabel, genderGirl, genderBoy, genderOther
    case deptLabel, deptGirls, deptBoys, deptJuniors, deptEither
    case shirtLabel, pantLabel, shoeLabel
    case prefsTitle, prefsOptional
    case colorsLabel, colorsPlaceholder
    case avoidLabel, avoidPlaceholder
    case sensoryLabel, sensoryPlaceholder
    case notesLabel
    case consentLabel, consentRequired
    case submitIntake, submitIntakeSaving
    // Video
    case videoTitle, videoSubtitle1, videoSubtitle2
    case recordNow, uploadVideo, usesCamera, fromPhone, skipVideo
    case startRecording, stopReview, goBack
    case previewLabel, retake, looksGood, skipDontInclude
    case uploadingVideo, videoReceived, videoReceivedMsg, videoReceivedMsg2
    case allDone
    // Done
    case intakeDoneTitle, intakeDoneMsg, intakeDoneMsg2
    // Portal
    case portalTitle, portalSubtitle
    case portalEmailLabel, portalEmailPlaceholder
    case portalLogin, portalLoggingIn, portalNotFound
    case portalWelcome
    case portalTotal, portalIntake, portalConsent, portalNeedsVideo
    case portalAwaiting, portalPending
    case portalNeedsVideoTitle, portalNeedsVideoEmpty
    case portalAllTitle
    case portalChildCol, portalStatusCol, portalIntakeCol, portalConsentCol, portalVideoCol
    case portalIntakeDone, portalIntakePending
    case portalConsentYes, portalConsentNo
    case portalVideoYes, portalVideoNeeded
    case portalLogout
}

/// Observable language store. Mirrors `useLang()` in App.jsx:255.
@MainActor
final class Lang: ObservableObject {
    enum Code: String { case en, es }

    @Published var code: Code {
        didSet { UserDefaults.standard.set(code.rawValue, forKey: "cs-lang") }
    }

    init() {
        let raw = UserDefaults.standard.string(forKey: "cs-lang") ?? "en"
        self.code = Code(rawValue: raw) ?? .en
    }

    func t(_ key: LangKey) -> String {
        LangDict.table[code]?[key] ?? LangDict.table[.en]?[key] ?? key.rawValue
    }
}

enum LangDict {
    static let table: [Lang.Code: [LangKey: String]] = [
        .en: enDict,
        .es: esDict,
    ]

    static let enDict: [LangKey: String] = [
        // Nav
        .home: "Home", .nominate: "Nominate", .volunteer: "Volunteer", .admin: "Admin", .portal: "My Portal",
        // Landing
        .sponsorBtn: "Sponsor a Child — $150",
        .nominateBtn: "Nominate a Child →",
        .volunteerBtn: "Sign Up to Volunteer →",
        // Nomination form
        .nomFormTitle: "Nominate a Child",
        .nomFormSubtitle: "about 3 minutes.",
        .nomFormConfidential: "All information is kept strictly confidential. Families are never told who nominated their child.",
        .childInfoTitle: "Child Information",
        .firstName: "First Name *", .lastName: "Last Name *",
        .studentId: "Student ID *", .studentIdPlaceholder: "e.g. 123456",
        .school: "School *", .selectSchool: "Select school...",
        .grade: "Grade *", .gradeLabel: "Grade",
        .gradeNote: "Elementary students only (K – 6th grade)",
        .yourInfoTitle: "Your Information",
        .yourName: "Your Name *", .fullName: "Full name",
        .role: "Role *", .email: "Email *",
        .parentGuardianTitle: "Parent / Guardian",
        .parentName: "Name *", .parentPhone: "Phone", .parentEmail: "Email",
        .preferredLang: "Preferred language",
        .langNote: "Notifications and forms will be sent in this language.",
        .detailsTitle: "Details",
        .whyNominate: "Why are you nominating this child?",
        .reasonPlaceholder: "Brief explanation — stays confidential",
        .siblingsQuestion: "Additional siblings to nominate?",
        .howManySiblings: "How many siblings?", .none: "None",
        .siblingLabel: "Sibling", .siblingName: "First & Last Name", .siblingStudentId: "Student ID",
        .siblingNote: "The parent will receive a separate size form for each child. Their notification will note that",
        .siblingNote2: "children from their family were nominated.",
        .submitNomination: "Submit Nomination", .submitting: "Submitting...",
        .nomSuccess: "Nomination Submitted!",
        .nomSuccessMsg: "Thank you for nominating this child. We'll take it from here.",
        .nominateAnother: "Nominate Another Child",
        // Intake
        .intakeTitle: "Sizes for", .intakeSubtitle: "A volunteer will shop brand new clothes for your child. Takes about 2 minutes.",
        .intakeConfidential: "Everything shared here is confidential and used only for shopping.",
        .aboutTitle: "About", .clothingSizes: "Clothing Sizes",
        .genderLabel: "Gender", .genderGirl: "Girl", .genderBoy: "Boy", .genderOther: "Non-binary / Other",
        .deptLabel: "Preferred shopping department",
        .deptGirls: "Girls' section", .deptBoys: "Boys' section", .deptJuniors: "Juniors' section (older girls)", .deptEither: "Either is fine",
        .shirtLabel: "Shirt *", .pantLabel: "Pants *", .shoeLabel: "Shoe *",
        .prefsTitle: "Preferences", .prefsOptional: "optional",
        .colorsLabel: "Favorite colors, styles, or characters?",
        .colorsPlaceholder: "e.g., Blue, dinosaurs, soccer",
        .avoidLabel: "Colors or styles to avoid?",
        .avoidPlaceholder: "e.g., No pink, no ruffles",
        .sensoryLabel: "Allergies or sensory needs?",
        .sensoryPlaceholder: "e.g., No wool, needs soft fabrics",
        .notesLabel: "Anything else?",
        .consentLabel: "I give permission for my child to participate in Child Spree 2026, and agree that the information I provide will be used by volunteers to shop for my child.",
        .consentRequired: "Please check the consent box to continue.",
        .submitIntake: "Submit →",
        .submitIntakeSaving: "Saving...",
        // Video
        .videoTitle: "Optional: Record a short video",
        .videoSubtitle1: "30–60 seconds. Tell us", .videoSubtitle2: "'s favorite color, what they love, the shoes they've been dreaming about!",
        .recordNow: "Record now", .uploadVideo: "Upload a video",
        .usesCamera: "Uses your camera", .fromPhone: "From your phone",
        .skipVideo: "Skip — no video",
        .startRecording: "Start Recording", .stopReview: "Stop & Review",
        .goBack: "← Back",
        .previewLabel: "Preview",
        .retake: "↩ Redo", .looksGood: "✓ Looks good — Upload",
        .skipDontInclude: "Skip — don't include video",
        .uploadingVideo: "Uploading your video...",
        .videoReceived: "Video received!",
        .videoReceivedMsg: "A volunteer will watch this before they shop for", .videoReceivedMsg2: ". It makes a huge difference.",
        .allDone: "All done ✓",
        // Done
        .intakeDoneTitle: "All Done!", .intakeDoneMsg: "We have everything we need for",
        .intakeDoneMsg2: ". A volunteer will shop brand new clothes just for them.",
        // Portal
        .portalTitle: "Family Advocate Portal", .portalSubtitle: "Track your nominated children",
        .portalEmailLabel: "Your school email address", .portalEmailPlaceholder: "you@davis.k12.ut.us",
        .portalLogin: "View My Dashboard", .portalLoggingIn: "Looking up your nominations...",
        .portalNotFound: "No nominations found for this email. Please use the exact email you used when submitting nominations.",
        .portalWelcome: "Welcome back,",
        .portalTotal: "Total Nominated", .portalIntake: "Intake Complete",
        .portalConsent: "Consented", .portalNeedsVideo: "Needs Video",
        .portalAwaiting: "Awaiting Parent", .portalPending: "Pending Review",
        .portalNeedsVideoTitle: "🎬 Children Who Still Need a Video",
        .portalNeedsVideoEmpty: "All children who completed intake have recorded a video.",
        .portalAllTitle: "All Nominated Children",
        .portalChildCol: "Child", .portalStatusCol: "Status", .portalIntakeCol: "Parent Intake",
        .portalConsentCol: "Consent", .portalVideoCol: "Video",
        .portalIntakeDone: "✅ Complete", .portalIntakePending: "⏳ Not yet",
        .portalConsentYes: "✅ Yes", .portalConsentNo: "—",
        .portalVideoYes: "🎬 Recorded", .portalVideoNeeded: "⚠️ Needed",
        .portalLogout: "Log out",
    ]

    static let esDict: [LangKey: String] = [
        // Nav
        .home: "Inicio", .nominate: "Nominar", .volunteer: "Voluntario", .admin: "Admin", .portal: "Mi Portal",
        // Landing
        .sponsorBtn: "Patrocinar un Niño — $150",
        .nominateBtn: "Nominar a un Niño →",
        .volunteerBtn: "Inscribirse como Voluntario →",
        // Nomination form
        .nomFormTitle: "Nominar a un Niño",
        .nomFormSubtitle: "aproximadamente 3 minutos.",
        .nomFormConfidential: "Toda la información se mantiene estrictamente confidencial. Las familias nunca saben quién nominó a su hijo/a.",
        .childInfoTitle: "Información del Niño/a",
        .firstName: "Nombre *", .lastName: "Apellido *",
        .studentId: "ID de Estudiante *", .studentIdPlaceholder: "ej. 123456",
        .school: "Escuela *", .selectSchool: "Seleccionar escuela...",
        .grade: "Grado *", .gradeLabel: "Grado",
        .gradeNote: "Solo estudiantes de primaria (K – 6to grado)",
        .yourInfoTitle: "Su Información",
        .yourName: "Su Nombre *", .fullName: "Nombre completo",
        .role: "Cargo *", .email: "Correo electrónico *",
        .parentGuardianTitle: "Padre / Tutor",
        .parentName: "Nombre *", .parentPhone: "Teléfono", .parentEmail: "Correo electrónico",
        .preferredLang: "Idioma preferido",
        .langNote: "Las notificaciones y formularios se enviarán en este idioma.",
        .detailsTitle: "Detalles",
        .whyNominate: "¿Por qué está nominando a este niño/a?",
        .reasonPlaceholder: "Breve explicación — se mantiene confidencial",
        .siblingsQuestion: "¿Hermanos adicionales para nominar?",
        .howManySiblings: "¿Cuántos hermanos?", .none: "Ninguno",
        .siblingLabel: "Hermano/a", .siblingName: "Nombre y Apellido", .siblingStudentId: "ID de Estudiante",
        .siblingNote: "El padre recibirá un formulario de tallas separado para cada niño/a. Su notificación indicará que",
        .siblingNote2: "niños de su familia fueron nominados.",
        .submitNomination: "Enviar Nominación", .submitting: "Enviando...",
        .nomSuccess: "¡Nominación Enviada!",
        .nomSuccessMsg: "Gracias por nominar a este niño/a. Nosotros nos encargamos del resto.",
        .nominateAnother: "Nominar Otro Niño/a",
        // Intake
        .intakeTitle: "Tallas para", .intakeSubtitle: "Un voluntario comprará ropa nueva para su hijo/a. Toma unos 2 minutos.",
        .intakeConfidential: "Todo lo que comparte aquí es confidencial y se usará únicamente para las compras.",
        .aboutTitle: "Sobre", .clothingSizes: "Tallas de Ropa",
        .genderLabel: "Género", .genderGirl: "Niña", .genderBoy: "Niño", .genderOther: "No binario / Otro",
        .deptLabel: "Departamento preferido para compras",
        .deptGirls: "Sección de niñas", .deptBoys: "Sección de niños", .deptJuniors: "Sección juvenil (niñas mayores)", .deptEither: "Cualquiera está bien",
        .shirtLabel: "Camiseta *", .pantLabel: "Pantalón *", .shoeLabel: "Zapato *",
        .prefsTitle: "Preferencias", .prefsOptional: "opcional",
        .colorsLabel: "¿Colores favoritos, estilos o personajes?",
        .colorsPlaceholder: "Ej: Azul, dinosaurios, fútbol",
        .avoidLabel: "¿Colores o estilos que evitar?",
        .avoidPlaceholder: "Ej: Sin rosado, sin volantes",
        .sensoryLabel: "¿Alergias o necesidades sensoriales?",
        .sensoryPlaceholder: "Ej: Sin lana, necesita telas suaves",
        .notesLabel: "¿Algo más?",
        .consentLabel: "Doy permiso para que mi hijo/a participe en Child Spree 2026, y acepto que la información que proporcione sea utilizada por los voluntarios para hacer las compras para mi hijo/a.",
        .consentRequired: "Por favor marque la casilla de consentimiento para continuar.",
        .submitIntake: "Enviar →",
        .submitIntakeSaving: "Guardando...",
        // Video
        .videoTitle: "Opcional: Grabe un video corto",
        .videoSubtitle1: "30–60 segundos. ¡Cuéntenos el color favorito de", .videoSubtitle2: ", lo que le gusta, los zapatos con los que ha soñado!",
        .recordNow: "Grabar ahora", .uploadVideo: "Subir un video",
        .usesCamera: "Usa su cámara", .fromPhone: "Desde su teléfono",
        .skipVideo: "Omitir — sin video",
        .startRecording: "Iniciar Grabación", .stopReview: "Detener y Revisar",
        .goBack: "← Atrás",
        .previewLabel: "Vista previa",
        .retake: "↩ Repetir", .looksGood: "✓ Se ve bien — Subir",
        .skipDontInclude: "Omitir — no incluir video",
        .uploadingVideo: "Subiendo su video...",
        .videoReceived: "¡Video recibido!",
        .videoReceivedMsg: "Un voluntario verá esto antes de comprar para", .videoReceivedMsg2: ". Hace una gran diferencia.",
        .allDone: "¡Listo! ✓",
        // Done
        .intakeDoneTitle: "¡Todo Listo!", .intakeDoneMsg: "Tenemos todo lo que necesitamos para",
        .intakeDoneMsg2: ". Un voluntario comprará ropa nueva específicamente para su hijo/a.",
        // Portal
        .portalTitle: "Portal del Coordinador Familiar", .portalSubtitle: "Seguimiento de niños nominados",
        .portalEmailLabel: "Su correo electrónico escolar", .portalEmailPlaceholder: "usted@davis.k12.ut.us",
        .portalLogin: "Ver Mi Panel", .portalLoggingIn: "Buscando sus nominaciones...",
        .portalNotFound: "No se encontraron nominaciones para este correo. Use el correo exacto con el que envió las nominaciones.",
        .portalWelcome: "Bienvenido/a,",
        .portalTotal: "Total Nominados", .portalIntake: "Formulario Completo",
        .portalConsent: "Con Consentimiento", .portalNeedsVideo: "Necesita Video",
        .portalAwaiting: "Esperando al Padre", .portalPending: "Pendiente de Revisión",
        .portalNeedsVideoTitle: "🎬 Niños que Aún Necesitan Video",
        .portalNeedsVideoEmpty: "Todos los niños que completaron el formulario han grabado un video.",
        .portalAllTitle: "Todos los Niños Nominados",
        .portalChildCol: "Niño/a", .portalStatusCol: "Estado", .portalIntakeCol: "Formulario del Padre",
        .portalConsentCol: "Consentimiento", .portalVideoCol: "Video",
        .portalIntakeDone: "✅ Completo", .portalIntakePending: "⏳ Pendiente",
        .portalConsentYes: "✅ Sí", .portalConsentNo: "—",
        .portalVideoYes: "🎬 Grabado", .portalVideoNeeded: "⚠️ Necesario",
        .portalLogout: "Cerrar sesión",
    ]
}
