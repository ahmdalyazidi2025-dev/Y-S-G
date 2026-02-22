import { requestPasswordResetAction } from "./src/app/actions/auth-actions"

async function test() {
    console.log("Testing requestPasswordResetAction...")
    const res = await requestPasswordResetAction("0555555555")
    console.log("Result:", res)
}

test()
