// Test file to verify overlap detection logic
// This demonstrates how the overlap detection works

// Helper function to convert time string to minutes for comparison
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

// Function to check if two time slots overlap
const doTimeSlotsOverlap = (slot1, slot2) => {
    const start1 = timeToMinutes(slot1.start)
    const end1 = timeToMinutes(slot1.end)
    const start2 = timeToMinutes(slot2.start)
    const end2 = timeToMinutes(slot2.end)

    // Two slots overlap if one starts before the other ends and ends after the other starts
    return start1 < end2 && start2 < end1
}

// Test cases
const testCases = [
    {
        name: "No overlap - sequential slots",
        slot1: { start: "09:00", end: "10:00" },
        slot2: { start: "10:00", end: "11:00" },
        expected: false
    },
    {
        name: "No overlap - different times",
        slot1: { start: "09:00", end: "10:00" },
        slot2: { start: "14:00", end: "15:00" },
        expected: false
    },
    {
        name: "Overlap - one contains the other",
        slot1: { start: "08:00", end: "11:00" },
        slot2: { start: "09:00", end: "10:00" },
        expected: true
    },
    {
        name: "Overlap - partial overlap start",
        slot1: { start: "09:00", end: "10:00" },
        slot2: { start: "09:30", end: "10:30" },
        expected: true
    },
    {
        name: "Overlap - partial overlap end",
        slot1: { start: "09:30", end: "10:30" },
        slot2: { start: "09:00", end: "10:00" },
        expected: true
    },
    {
        name: "Overlap - exact same time",
        slot1: { start: "09:00", end: "10:00" },
        slot2: { start: "09:00", end: "10:00" },
        expected: true
    }
]

console.log("Testing overlap detection logic:\n")

testCases.forEach((testCase, index) => {
    const result = doTimeSlotsOverlap(testCase.slot1, testCase.slot2)
    const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL"

    console.log(`${index + 1}. ${testCase.name}`)
    console.log(`   Slot 1: ${testCase.slot1.start} - ${testCase.slot1.end}`)
    console.log(`   Slot 2: ${testCase.slot2.start} - ${testCase.slot2.end}`)
    console.log(`   Expected: ${testCase.expected}, Got: ${result} ${status}\n`)
})

// Test the specific example from the user
console.log("User's specific example:")
const userExample1 = { start: "09:00", end: "10:00" }
const userExample2 = { start: "08:00", end: "11:00" }
const userResult = doTimeSlotsOverlap(userExample1, userExample2)
console.log(`Monday (9:00 AM - 10:00 AM)`)
console.log(`Monday (8:00 AM - 11:00 AM)`)
console.log(`Overlap detected: ${userResult} ${userResult ? "✅ CORRECT" : "❌ INCORRECT"}`) 