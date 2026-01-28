"use client"

import { useStore } from "@/context/store-context"
import { sounds as defaultSounds } from "@/lib/sounds"

export type SoundEvent = 'newOrder' | 'newMessage' | 'statusUpdate' | 'systemPop' | 'generalPush'

export function useSounds() {
    const { storeSettings } = useStore()

    const playSound = (event: SoundEvent) => {
        if (typeof window === 'undefined') return

        try {
            // Priority: Custom sound from settings -> Default sound from sounds.ts
            let audioSource = ""

            if (storeSettings.sounds?.[event]) {
                audioSource = storeSettings.sounds[event]!
            } else {
                // Mapping Event to default sounds
                switch (event) {
                    case 'newOrder':
                        audioSource = defaultSounds.success
                        break
                    case 'newMessage':
                        audioSource = defaultSounds.notification
                        break
                    case 'statusUpdate':
                        audioSource = defaultSounds.alert
                        break
                    case 'systemPop':
                        audioSource = defaultSounds.notification
                        break
                    case 'generalPush':
                        audioSource = defaultSounds.notification
                        break
                }

                if (!audioSource) return

                const audio = new Audio(audioSource)
                audio.volume = event === 'newOrder' ? 0.8 : 0.5
                audio.play().catch(e => console.error(`[useSounds] Play failed for ${event}:`, e))
            } catch (e) {
                console.error(`[useSounds] Init failed for ${event}:`, e)
            }
        }

    return { playSound }
    }
