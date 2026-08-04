export const PROPERTY_TYPES = [
    { value: "SELF_CONTAIN", label: "Self Contain" },
    { value: "ROOM_AND_PARLOUR", label: "Room & Parlour" },
    { value: "MINI_FLAT", label: "Mini Flat" },
    { value: "APARTMENT_2BED", label: "2-Bedroom Apartment" },
    { value: "APARTMENT_3BED", label: "3-Bedroom Apartment" },
    { value: "APARTMENT_4BED", label: "4-Bedroom Apartment" },
    { value: "DUPLEX", label: "Duplex" },
    { value: "BUNGALOW", label: "Bungalow" },
    { value: "DETACHED_HOUSE", label: "Detached House" },
    { value: "SEMI_DETACHED", label: "Semi-Detached" },
    { value: "TERRACE", label: "Terrace" },
    { value: "PENTHOUSE", label: "Penthouse" },
    { value: "STUDIO", label: "Studio" },
];

export const PROPERTY_CATEGORIES = [
    { label: "Apartments", value: "APARTMENT" },
    { label: "Houses", value: "HOUSE" },
    { label: "Duplex", value: "DUPLEX" },
    { label: "Studio / Single", value: "STUDIO" }
];

export const DETAILED_TYPES_MAP: Record<string, string[]> = {
    "APARTMENT": ["MINI_FLAT", "APARTMENT_2BED", "APARTMENT_3BED", "APARTMENT_4BED", "PENTHOUSE"],
    "HOUSE": ["DETACHED_HOUSE", "SEMI_DETACHED", "BUNGALOW", "TERRACE"],
    "DUPLEX": ["DUPLEX"],
    "STUDIO": ["STUDIO", "SELF_CONTAIN", "ROOM_AND_PARLOUR"]
};
