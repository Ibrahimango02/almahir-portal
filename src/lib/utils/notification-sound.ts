// Utility for playing notification sounds
class NotificationSound {
    private audio: AudioContext | null = null
    private isEnabled: boolean = true

    constructor() {
        // Create a simple notification sound using Web Audio API
        this.createNotificationSound()
    }

    private createNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)

            // Store the audio context for reuse
            this.audio = audioContext
        } catch (error) {
            console.warn('Could not create notification sound:', error)
        }
    }

    play() {
        if (!this.isEnabled || !this.audio) return

        try {
            // Recreate the sound for each notification
            this.createNotificationSound()
        } catch (error) {
            console.warn('Could not play notification sound:', error)
        }
    }

    enable() {
        this.isEnabled = true
    }

    disable() {
        this.isEnabled = false
    }

    isSoundEnabled() {
        return this.isEnabled
    }
}

// Create a singleton instance
export const notificationSound = new NotificationSound()

// Export the class for testing purposes
export { NotificationSound } 