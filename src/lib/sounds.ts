export const sounds = {
    // Simple "Pop" / "Ping" - 0.2s
    notification: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2CfutvKZDY2YZ/K381iNjZhmMbV4GU4N2CSutXVZzg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YIA=",

    // "Success" / "Cash Register" - 0.5s (simulated with a rising tone)
    success: "data:audio/wav;base64,UklGRiQIAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAIAACAgYCBgoKDA4SEhYUGhobHBweIiIiJCQoKCwwMDQ4ODxAQERITExQVFhcXFxgZGRobGxwcHR4eHyAgISIiIyQkJSUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/",

    // "Alert" / "Beep" - High pitch
    alert: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2CfutvKZDY2YZ/K381iNjZhmMbV4GU4N2CSutXVZzg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YIA="
}

export const playSound = (type: 'notification' | 'success' | 'alert') => {
    if (typeof window === 'undefined') return

    try {
        const audio = new Audio(sounds[type])
        audio.volume = 0.5
        audio.play().catch(e => console.error("Audio play failed", e))
    } catch (e) {
        console.error("Audio init failed", e)
    }
}

export const playNewOrderSound = () => {
    // Distinct, louder sound for money/orders
    if (typeof window === 'undefined') return
    try {
        const audio = new Audio(sounds.success)
        audio.volume = 0.8
        audio.play().catch(e => console.error("Order Audio play failed", e))
    } catch (e) {
        console.error("Audio init failed", e)
    }
}

export const playNotificationSound = () => playSound('notification')
export const playAlertSound = () => playSound('alert')
