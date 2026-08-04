import axios from "axios";

async function test() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";
    const url = `http://localhost:5001/api/properties?landlordId=${landlordId}`;

    console.log(`Testing URL: ${url}`);
    try {
        const res = await axios.get(url);
        console.log("RESPONSE DATA TOTAL:", res.data.data.total);
        console.log("DEBUG WHERE:", JSON.stringify(res.data.data.debugWhere, null, 2));

        const targetId = "cmkrarr920006gd91905y8vzw";
        const foundTarget = res.data.data.properties.some((p: any) => p.id === targetId);
        console.log(`Specific Property Found (${targetId}): ${foundTarget}`);

        res.data.data.properties.forEach((p: any) => {
            console.log(`- ${p.title} (ID: ${p.id}, Landlord: ${p.landlordId})`);
        });
    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

test();
