import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
    "Abia": { lat: 5.4309, lng: 7.5247 },
    "Adamawa": { lat: 9.3265, lng: 12.4411 },
    "Akwa Ibom": { lat: 5.0377, lng: 7.9128 },
    "Anambra": { lat: 6.2209, lng: 7.0722 },
    "Bauchi": { lat: 10.3158, lng: 9.8442 },
    "Bayelsa": { lat: 4.7719, lng: 6.0699 },
    "Benue": { lat: 7.7304, lng: 8.5214 },
    "Borno": { lat: 11.8333, lng: 13.1500 },
    "Cross River": { lat: 5.8702, lng: 8.5988 },
    "Delta": { lat: 5.6800, lng: 6.1800 },
    "Ebonyi": { lat: 6.2649, lng: 8.0137 },
    "Edo": { lat: 6.5438, lng: 5.8987 },
    "Ekiti": { lat: 7.6211, lng: 5.2215 },
    "Enugu": { lat: 6.5364, lng: 7.4356 },
    "FCT": { lat: 9.0765, lng: 7.3986 },
    "Gombe": { lat: 10.2791, lng: 11.1731 },
    "Imo": { lat: 5.4924, lng: 7.0267 },
    "Jigawa": { lat: 12.2280, lng: 9.5616 },
    "Kaduna": { lat: 10.5105, lng: 7.4165 },
    "Kano": { lat: 12.0022, lng: 8.5920 },
    "Katsina": { lat: 12.9855, lng: 7.6171 },
    "Kebbi": { lat: 11.4582, lng: 4.1999 },
    "Kogi": { lat: 7.7337, lng: 6.6906 },
    "Kwara": { lat: 8.9669, lng: 4.6006 },
    "Lagos": { lat: 6.5244, lng: 3.3792 },
    "Nasarawa": { lat: 8.5475, lng: 8.3570 },
    "Niger": { lat: 9.9309, lng: 5.5983 },
    "Ogun": { lat: 7.1604, lng: 3.3483 },
    "Ondo": { lat: 7.2571, lng: 5.2058 },
    "Osun": { lat: 7.5629, lng: 4.5200 },
    "Oyo": { lat: 7.3775, lng: 3.9470 },
    "Plateau": { lat: 9.9298, lng: 8.8921 },
    "Rivers": { lat: 4.8156, lng: 7.0498 },
    "Sokoto": { lat: 13.0609, lng: 5.2476 },
    "Taraba": { lat: 8.8937, lng: 11.3600 },
    "Yobe": { lat: 11.7470, lng: 11.9660 },
    "Zamfara": { lat: 12.1704, lng: 6.6594 }
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    "Lekki": { lat: 6.4698, lng: 3.5852 },
    "Ikoyi": { lat: 6.4549, lng: 3.4357 },
    "Victoria Island": { lat: 6.4281, lng: 3.4219 },
    "Ikeja": { lat: 6.6018, lng: 3.3515 },
    "Yaba": { lat: 6.5095, lng: 3.3711 },
    "Surulere": { lat: 6.4975, lng: 3.3546 },
    "Ajah": { lat: 6.4682, lng: 3.5684 },
    "Gbagada": { lat: 6.5567, lng: 3.3857 },
    "Magodo": { lat: 6.6186, lng: 3.3824 },
    "Maryland": { lat: 6.5744, lng: 3.3664 },
    "Festac": { lat: 6.4667, lng: 3.2833 },
    "Maitama": { lat: 9.0882, lng: 7.4934 },
    "Wuse": { lat: 9.0644, lng: 7.4686 },
    "Wuse 2": { lat: 9.0778, lng: 7.4722 },
    "Gwarinpa": { lat: 9.1099, lng: 7.4042 },
    "Asokoro": { lat: 9.0436, lng: 7.5218 },
    "Jahi": { lat: 9.0889, lng: 7.4333 },
    "Utako": { lat: 9.0611, lng: 7.4444 },
    "Apo": { lat: 8.9944, lng: 7.4989 },
    "Guzape": { lat: 9.0278, lng: 7.5139 },
    "Lugbe": { lat: 8.9750, lng: 7.3750 },
    "Kubwa": { lat: 9.1500, lng: 7.3333 },
    "Port Harcourt": { lat: 4.8156, lng: 7.0498 },
    "Obio/Akpor": { lat: 4.8450, lng: 7.0120 },
    "Ibadan": { lat: 7.3775, lng: 3.9470 },
    "Ibadan North": { lat: 7.4167, lng: 3.9000 },
    "Enugu": { lat: 6.5364, lng: 7.4356 },
    "Enugu North": { lat: 6.4500, lng: 7.5100 },
    "Kano": { lat: 12.0022, lng: 8.5920 },
    "Kano Municipal": { lat: 11.9964, lng: 8.5167 },
};

async function main() {
    console.log("Updating properties with coordinates...");
    const properties = await prisma.property.findMany();
    console.log(`Found ${properties.length} properties.`);

    let updated = 0;
    for (let i = 0; i < properties.length; i++) {
        const p = properties[i];
        let lat = p.latitude;
        let lng = p.longitude;

        if (!lat || !lng) {
            if (p.city && CITY_COORDINATES[p.city]) {
                const jitter = ((i * 13) % 20 - 10) * 0.003;
                lat = CITY_COORDINATES[p.city].lat + jitter;
                lng = CITY_COORDINATES[p.city].lng + jitter;
            } else if (p.state && STATE_COORDINATES[p.state]) {
                const jitter = ((i * 17) % 30 - 15) * 0.005;
                lat = STATE_COORDINATES[p.state].lat + jitter;
                lng = STATE_COORDINATES[p.state].lng + jitter;
            } else {
                lat = 9.0765 + ((i % 10) - 5) * 0.01;
                lng = 7.3986 + ((i % 10) - 5) * 0.01;
            }

            await prisma.property.update({
                where: { id: p.id },
                data: {
                    latitude: parseFloat(lat.toFixed(6)),
                    longitude: parseFloat(lng.toFixed(6)),
                },
            });
            updated++;
        }
    }

    console.log(`Successfully updated ${updated} properties with latitude and longitude!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
