import { PrismaClient, AmenityCategory, UserRole, PropertyType, PropertyStatus, PaymentTerms, PowerSupply, WaterSupply } from "@prisma/client";

const prisma = new PrismaClient();

const PROPERTY_IMAGES = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
];

const NIGERIAN_LOCATIONS: Record<string, string[]> = {
    "Abia": ["Aba North", "Aba South", "Arochukwu", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obingwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"],
    "Adamawa": ["Demsa", "Fufure", "Ganyi", "Gaye", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
    "Akwa Ibom": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
    "Anambra": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
    "Bauchi": ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
    "Bayelsa": ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
    "Benue": ["Agatu", "Apa", "Ado", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
    "Borno": ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
    "Cross River": ["Akpabuyo", "Odukpani", "Akamkpa", "Biase", "Abi", "Ikom", "Yarkur", "Odubra", "Boki", "Ogoja", "Yala", "Obanliku", "Obudu", "Bakassi", "Bekwarra", "Etung", "Obubra", "Calabar Municipal", "Calabar South"],
    "Delta": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
    "Ebonyi": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
    "Edo": ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
    "Ekiti": ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilemeji", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
    "Enugu": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Ituku-Ozalla", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
    "FCT": ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council", "Maitama", "Wuse", "Wuse 2", "Gwarinpa", "Asokoro", "Jahi", "Utako", "Apo", "Guzape", "Lugbe", "Kubwa", "Karu", "Lokogoma"],
    "Gombe": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
    "Imo": ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri South", "Onuimo"],
    "Jigawa": ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
    "Kaduna": ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
    "Kano": ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabalawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nassarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
    "Katsina": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
    "Kebbi": ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
    "Kogi": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela-Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa-Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
    "Kwara": ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
    "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere", "Lekki", "Ikoyi", "Victoria Island", "Yaba", "Ajah", "Magodo", "Gbagada", "Maryland", "Festac"],
    "Nasarawa": ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
    "Niger": ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Minna", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
    "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Sagamu", "Yewa North", "Yewa South"],
    "Ondo": ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
    "Osun": ["Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Ife Central", "Ife East", "Ife North", "Ife South", "Egbedore", "Ejigbo", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
    "Oyo": ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo", "Oyo East", "Saki East", "Saki West", "Surulere"],
    "Plateau": ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
    "Rivers": ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
    "Sokoto": ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
    "Taraba": ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
    "Yobe": ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
    "Zamfara": ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Chafe", "Zurmi"]
};

const LANDLORD_IDS = [
    "cmkr8rjtd000013z4sdmkyz45",
    "cmkr8wmur000113z4q5prmaq6"
];

async function main() {
    console.log("🌱 Starting National seed...");

    // 1. Clean up existing properties for target landlords (robustly)
    console.log("Cleaning up existing properties...");

    // First, delete dependent records
    await prisma.transaction.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.favorite.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.tourRequest.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.conversation.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.review.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.propertyView.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.serviceTransaction.deleteMany({
        where: { propertyId: { not: null }, property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.image.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });
    await prisma.propertyAmenity.deleteMany({
        where: { property: { landlordId: { in: LANDLORD_IDS } } }
    });

    // Finally, delete the properties
    await prisma.property.deleteMany({
        where: { landlordId: { in: LANDLORD_IDS } }
    });

    const allAmenities = await prisma.amenity.findMany();

    const housingTemplates = [
        { type: PropertyType.APARTMENT_2BED, title: "Modern 2-Bedroom Flat", price: 1500000 },
        { type: PropertyType.APARTMENT_3BED, title: "Spacious 3-Bedroom Apartment", price: 2500000 },
        { type: PropertyType.MINI_FLAT, title: "Executive Mini Flat", price: 800000 },
        { type: PropertyType.SELF_CONTAIN, title: "Serviced Self-Contain", price: 400000 },
        { type: PropertyType.DUPLEX, title: "Luxury 4-Bedroom Duplex", price: 5000000 },
        { type: PropertyType.BUNGALOW, title: "State-of-the-Art Bungalow", price: 3500000 },
        { type: PropertyType.PENTHOUSE, title: "Grand View Penthouse", price: 7000000 },
        { type: PropertyType.STUDIO, title: "Prime Studio Apartment", price: 1000000 },
    ];

    const states = Object.keys(NIGERIAN_LOCATIONS);
    let count = 0;

    console.log(`Generating properties for 36 states and FCT...`);

    for (const state of states) {
        const cities = NIGERIAN_LOCATIONS[state];

        // Create 1-2 properties per state to avoid massive initial bulk during dev
        const propsForState = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < propsForState; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const landlordId = LANDLORD_IDS[count % LANDLORD_IDS.length];
            const template = housingTemplates[Math.floor(Math.random() * housingTemplates.length)];

            // Realistic regional pricing tiers
            let primeFactor = 0.8; // default (low tier states)

            if (["Lagos", "FCT"].includes(state)) {
                primeFactor = 3.5; // Lagos/Abuja (Mega hubs)
            } else if (["Rivers", "Oyo", "Delta", "Anambra"].includes(state)) {
                primeFactor = 2.0; // Major commercial hubs
            } else if (["Enugu", "Ogun", "Kaduna", "Kano", "Edo", "Akwa Ibom"].includes(state)) {
                primeFactor = 1.5; // Developed industrial/educational hubs
            } else if (["Ondo", "Imo", "Kwara", "Nasarawa", "Plateau", "Abia"].includes(state)) {
                primeFactor = 1.2; // Growing regional capitals
            }

            // Randomly vary the factor slightly within the tier (±15%)
            const variance = 0.85 + (Math.random() * 0.3);
            const finalPrice = Math.floor(template.price * primeFactor * variance);

            // Format price to nearest 50k for realism
            const polishedPrice = Math.round(finalPrice / 50000) * 50000;

            // Random amenities and images
            const selectedAmenities = [...allAmenities].sort(() => 0.5 - Math.random()).slice(0, 5);
            const selectedImages = [...PROPERTY_IMAGES].sort(() => 0.5 - Math.random()).slice(0, 3);

            await prisma.property.create({
                data: {
                    title: `${template.title} in ${city}`,
                    description: `Beautifully finished ${template.type.replace(/_/g, ' ')} located in a serene part of ${city}, ${state}. High quality finishing and prime security.`,
                    address: `${Math.floor(Math.random() * 50) + 1}, Some Link Road, ${city}`,
                    city: city,
                    state: state,
                    country: "Nigeria",
                    propertyType: template.type,
                    bedrooms: template.type.includes('2BED') ? 2 : template.type.includes('3BED') ? 3 : Math.floor(Math.random() * 2) + 1,
                    bathrooms: Math.floor(Math.random() * 3) + 1,
                    toilets: Math.floor(Math.random() * 3) + 1,
                    parkingSpaces: Math.floor(Math.random() * 4), // 0 to 3 spaces
                    pricePerYear: polishedPrice,
                    agentFee: 0,
                    cautionFee: finalPrice * 0.1,
                    legalFee: finalPrice * 0.05,
                    paymentTerms: PaymentTerms.ONE_YEAR,
                    status: PropertyStatus.AVAILABLE,

                    // Diversity Scenarios for Filtering
                    powerSupply: [
                        PowerSupply.GRID_ONLY,
                        PowerSupply.GRID_AND_GENERATOR,
                        PowerSupply.GRID_AND_SOLAR,
                        PowerSupply.SOLAR_ONLY
                    ][Math.floor(Math.random() * 4)],

                    waterSupply: [
                        WaterSupply.BOREHOLE,
                        WaterSupply.TREATED_WATER,
                        WaterSupply.BOTH
                    ][Math.floor(Math.random() * 3)],

                    serviced: Math.random() > 0.6, // 40% are serviced
                    furnished: Math.random() > 0.7, // 30% are furnished
                    petsAllowed: Math.random() > 0.8,

                    landlordId: landlordId,
                    verified: true, // Auto-verify seed data
                    featured: Math.random() > 0.8,
                    amenities: {
                        create: selectedAmenities.map(a => ({
                            amenity: { connect: { id: a.id } }
                        }))
                    },
                    images: {
                        create: selectedImages.map((url, idx) => ({
                            url: url,
                            publicId: `seed_img_${Date.now()}_${count}_${idx}`,
                            isPrimary: idx === 0,
                            order: idx
                        }))
                    }
                }
            });
            count++;
        }
    }

    console.log(`✅ Seed completed! Created ${count} properties across Nigeria.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
