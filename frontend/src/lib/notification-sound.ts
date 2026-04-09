/**
 * Genera y reproduce un sonido de zumbido para notificaciones
 */
export function playNotificationSound() {
  try {
    // Usar Web Audio API para generar sonido de zumbido
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.error('[playNotificationSound] AudioContext no disponible');
      return;
    }

    const audioContext = new AudioContext();
    
    // Resumir contexto si está suspendido (algunos navegadores requieren esto)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((e: any) => console.error('Error resuming AudioContext:', e));
    }

    console.log('[playNotificationSound] Iniciando sonido de notificación...');

    // Primer zumbido
    playBuzz(audioContext, 0);
    
    // Segundo zumbido (250ms después)
    setTimeout(() => playBuzz(audioContext, 250), 250);
  } catch (error) {
    console.error('[playNotificationSound] Error:', error);
  }
}

function playBuzz(audioContext: any, delay: number) {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar el sonido: frecuencia media para zumbido perceptible
    oscillator.frequency.value = 400; // Hz
    oscillator.type = 'sine';
    
    const startTime = audioContext.currentTime;
    const duration = 0.15;
    
    // Fade in rápido, mantener, fade out
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.03);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    console.log('[playNotificationSound] Buzz reproducido');
  } catch (error) {
    console.error('[playBuzz] Error:', error);
  }
}
