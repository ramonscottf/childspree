import Foundation

/// Static lists mirroring the constants at the top of `src/App.jsx:49-63`.
enum Catalogs {
    static let shirtSizesBoys = [
        "Youth XS (4-5)", "Youth S (6-7)", "Youth M (8)", "Youth L (10-12)",
        "Youth XL (14-16)", "Youth XXL (18-20)",
        "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL",
    ]

    static let shirtSizesGirls = [
        "Youth XS (4-5)", "Youth S (6-7)", "Youth M (8)", "Youth L (10-12)",
        "Youth XL (14-16)",
        "Juniors XXS", "Juniors XS", "Juniors S", "Juniors M", "Juniors L", "Juniors XL",
        "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL",
    ]

    static let pantSizesBoys = [
        "Youth 4", "Youth 5", "Youth 6", "Youth 7", "Youth 8", "Youth 10", "Youth 12",
        "Youth 14", "Youth 16", "Youth 18", "Youth 20",
        "Husky 8", "Husky 10", "Husky 12", "Husky 14", "Husky 16", "Husky 18",
        "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL",
        "Adult 28W", "Adult 30W", "Adult 32W", "Adult 34W", "Adult 36W",
    ]

    static let pantSizesGirls = [
        "Youth 4", "Youth 5", "Youth 6", "Youth 6X/7", "Youth 8", "Youth 10",
        "Youth 12", "Youth 14", "Youth 16",
        "Juniors 0", "Juniors 1", "Juniors 3", "Juniors 5", "Juniors 7", "Juniors 9",
        "Juniors 11", "Juniors 13", "Juniors 15", "Juniors 17",
        "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL",
        "Adult 24W", "Adult 26W", "Adult 28W", "Adult 30W", "Adult 32W",
    ]

    /// Kid / adult shoe sizes — web uses a free-text field; we provide a common picker list.
    static let shoeSizes: [String] = {
        var sizes: [String] = []
        for n in 10...13 { sizes.append("Toddler \(n)") }
        for n in 1...6 { sizes.append("Kids \(n)") }
        for n in 1...7 { sizes.append("Youth \(n)") }
        for half in stride(from: 5.0, through: 13.0, by: 0.5) {
            if half == floor(half) {
                sizes.append("Adult \(Int(half))")
            } else {
                sizes.append("Adult \(half)")
            }
        }
        return sizes
    }()

    static let volunteerShirts = ["YS", "YM", "YL", "AS", "AM", "AL", "AXL", "A2XL"]

    static let grades = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th"]

    static let schools = [
        "Adams Elementary", "Adelaide Elementary", "Antelope Elementary", "Bluff Ridge Elementary",
        "Boulton Elementary", "Bountiful Elementary", "Buffalo Point Elementary", "Burton Elementary",
        "Canyon Creek Elementary", "Centerville Elementary", "Clinton Elementary", "Columbia Elementary",
        "Cook Elementary", "Creekside Elementary", "Crestview Elementary", "Davis Connect",
        "Doxey Elementary", "Eagle Bay Elementary", "East Layton Elementary", "Ellison Park Elementary",
        "Endeavor Elementary", "Farmington Elementary", "Foxboro Elementary", "Heritage Elementary",
        "Hill Field Elementary", "Holbrook Elementary", "Holt Elementary", "Island View Elementary",
        "Kay's Creek Elementary", "Kaysville Elementary", "King Elementary", "Knowlton Elementary",
        "Lakeside Elementary", "Layton Elementary", "Lincoln Elementary", "Meadowbrook Elementary",
        "Morgan Elementary", "Mountain View Elementary", "Muir Elementary", "Oak Hills Elementary",
        "Odyssey Elementary", "Orchard Elementary", "Parkside Elementary", "Reading Elementary",
        "Sand Springs Elementary", "Snow Horse Elementary", "So. Clearfield Elementary",
        "So. Weber Elementary", "Stewart Elementary", "Sunburst Elementary", "Sunset Elementary",
        "Syracuse Elementary", "Taylor Elementary", "Tolman Elementary", "Vae View Elementary",
        "Valley View Elementary", "Wasatch Elementary", "West Bountiful Elementary",
        "West Clinton Elementary", "West Point Elementary", "Whitesides Elementary",
        "Windridge Elementary", "Woods Cross Elementary",
    ]

    /// Landing hero photos — URLs copied from `src/App.jsx:56`.
    static let heroPhotos: [String] = [
        "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/edac9afc-9cc4-4880-ad8a-6c858f765f28/child-spree-america-first-volunteers-group.jpg?disposition=inline",
        "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ddb3a7a7-2722-4d47-ac13-f2ce041042ef/child-spree-citi-volunteers-group.jpg?disposition=inline",
        "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/bcde49b8-2c6d-43cb-a18e-09dd4c08bd50/child-spree-america-first-volunteer-with-shopper.jpg?disposition=inline",
        "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/5a3d3ca7-d8e5-4dcd-9e7c-87e29d590980/child-spree-teen-volunteer-group-with-cart.jpg?disposition=inline",
        "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/81ef2dc4-cfcb-4687-aa20-03bf329972c8/child-spree-volunteer-helping-shopper-browse.jpg?disposition=inline",
        "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ca2263e5-c82c-4a94-bb70-46d64545058b/child-spree-two-volunteers-smiling.jpg?disposition=inline",
    ]

    /// Logo served from the same media CDN as the web app.
    static let logoURL = "https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png"

    static let nominatorRoles = ["Teacher", "Counselor", "Principal", "Social Worker", "Staff", "Other"]

    static let volunteerGroupTypes = [
        "Just me", "Family", "Church group", "Business/Work group",
        "Scout troop", "School group", "Other",
    ]

    static let storeLocations = [
        "Kohl's Layton", "Kohl's Centerville", "Kohl's Clinton",
    ]

    static let arrivalTimes = [
        "6:30 AM (early — help with setup)",
        "7:00 AM (standard)",
    ]
}
