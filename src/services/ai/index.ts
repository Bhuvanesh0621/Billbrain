import { prisma } from "@/lib/prisma"

export async function analyzeBillIntelligence(billId: string, userId: string) {
  // Fetch the current bill
  const currentBill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { items: true }
  })

  if (!currentBill) return

  // Fetch past bills for comparison
  const pastBills = await prisma.bill.findMany({
    where: {
      userId,
      category: currentBill.category,
      id: { not: billId },
      createdAt: { lt: currentBill.createdAt }
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  })

  const insightsToCreate: any[] = []

  // Check for duplicate charges within the same bill
  const descriptions = currentBill.items.map(item => item.description.toLowerCase())
  const duplicates = descriptions.filter((item, index) => descriptions.indexOf(item) !== index)
  
  if (duplicates.length > 0) {
    insightsToCreate.push({
      userId,
      billId,
      type: "anomaly",
      severity: "high",
      confidence: 0.95,
      message: `Possible duplicate charge detected for: "${duplicates[0]}".`
    })
  }

  // Anomaly: Unexpected price increase (if > 20% compared to average)
  if (pastBills.length > 0) {
    const avgPast = pastBills.reduce((acc, b) => acc + b.amount, 0) / pastBills.length
    const diff = currentBill.amount - avgPast
    const percentage = (diff / avgPast) * 100

    if (percentage > 20) {
      insightsToCreate.push({
        userId,
        billId,
        type: "anomaly",
        severity: "medium",
        confidence: 0.85,
        message: `This bill is ${percentage.toFixed(0)}% higher than your historical average for ${currentBill.category}.`
      })
      
      // Also flag potential savings if applicable
      if (currentBill.category === 'Electricity' || currentBill.category === 'Mobile') {
        insightsToCreate.push({
          userId,
          billId,
          type: "saving",
          severity: "low",
          confidence: 0.70,
          message: `Your ${currentBill.category} usage is above average. Estimated savings opportunity: ₹${(diff * 0.5).toFixed(0)} if reduced.`
        })
      }
    } else if (percentage < -20) {
       // It's lower!
       insightsToCreate.push({
        userId,
        billId,
        type: "insight",
        severity: "low",
        confidence: 0.9,
        message: `Great job! This bill is ${Math.abs(percentage).toFixed(0)}% lower than your historical average.`
      })
    }
  }

  // If new fees are detected that weren't in the last bill
  if (pastBills.length > 0) {
    const lastBill = await prisma.bill.findUnique({
      where: { id: pastBills[0].id },
      include: { items: true }
    })
    
    if (lastBill) {
      const oldItemDesc = lastBill.items.map(i => i.description.toLowerCase())
      for (const item of currentBill.items) {
        if (!oldItemDesc.includes(item.description.toLowerCase())) {
          insightsToCreate.push({
            userId,
            billId,
            type: "anomaly",
            severity: "medium",
            confidence: 0.8,
            message: `New fee detected: "${item.description}" was not present in your previous bill.`
          })
        }
      }
    }
  }

  // Create all generated insights in the database
  if (insightsToCreate.length > 0) {
    await prisma.aiInsight.createMany({
      data: insightsToCreate
    })
  }

  // Update bill AI status
  await prisma.bill.update({
    where: { id: billId },
    data: { aiStatus: "analyzed" }
  })
}
