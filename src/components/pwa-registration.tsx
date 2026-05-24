"use client"

import { useEffect } from "react"

export function PwaRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("SW Registered", reg);
                    
                    // Check for updates periodically
                    reg.onupdatefound = () => {
                        const installingWorker = reg.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === "installed") {
                                    if (navigator.serviceWorker.controller) {
                                        console.log("SW: New update available!");
                                    }
                                }
                            };
                        }
                    };
                })
                .catch((err) => console.log("SW Registration Failed", err));

            // Reload the page when the new service worker takes control (claims the client)
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!refreshing) {
                    refreshing = true;
                    console.log("SW: Controller changed, reloading page...");
                    window.location.reload();
                }
            });
        }
    }, [])

    return null
}
