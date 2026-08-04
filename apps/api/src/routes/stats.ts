import { Router } from "express";
import { prisma } from "../config/database";

const router: Router = Router();

router.get("/public", async (req, res) => {
    try {
        const [propertyCount, userCount, transactionStats] = await Promise.all([
            prisma.property.count({ where: { status: "AVAILABLE" } }),
            prisma.user.count(),
            prisma.transaction.aggregate({
                _sum: {
                    rentAmount: true,
                },
                where: {
                    status: {
                        in: ["ESCROWED", "RELEASED"] as any,
                    }
                }
            })
        ]);

        const totalRent = transactionStats._sum.rentAmount || 0;

        // Calculate savings:
        // Typical agent fee in Nigeria is 10-20% of rent. 
        // We charge 2%. 
        // Savings = (TypicalFee - OurFee)
        const typicalFee = totalRent * 0.15; // 15% average
        const ourFee = totalRent * 0.02; // 2%
        const savings = Math.max(0, typicalFee - ourFee);

        res.json({
            success: true,
            data: {
                verifiedProperties: propertyCount,
                communityMembers: userCount,
                totalSavings: savings,
                impactCities: 1 // Starting in Abuja as per Manifesto
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ success: false, message: "Error fetching platform statistics" });
    }
});

export default router;
