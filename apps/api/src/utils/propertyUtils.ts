import { PropertyType } from "@prisma/client";

export const mapPropertyType = (type: string): PropertyType[] => {
    switch (type.toUpperCase()) {
        case "APARTMENT":
            return [
                PropertyType.APARTMENT_2BED,
                PropertyType.APARTMENT_3BED,
                PropertyType.APARTMENT_4BED,
                PropertyType.MINI_FLAT,
                PropertyType.PENTHOUSE
            ];
        case "HOUSE":
            return [
                PropertyType.DETACHED_HOUSE,
                PropertyType.SEMI_DETACHED,
                PropertyType.BUNGALOW,
                PropertyType.TERRACE
            ];
        case "DUPLEX":
            return [PropertyType.DUPLEX];
        case "STUDIO":
            return [PropertyType.STUDIO, PropertyType.SELF_CONTAIN, PropertyType.ROOM_AND_PARLOUR];
        default:
            // If it matches a specific enum, return it
            if (Object.values(PropertyType).includes(type as PropertyType)) {
                return [type as PropertyType];
            }
            return Object.values(PropertyType);
    }
};
