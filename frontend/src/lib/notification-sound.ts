/**
 * Genera y reproduce un sonido de notificación amigable (pip suave)
 */
export function playNotificationSound() {
  try {
    // Usar Web Audio API para generar sonido de notificación
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.error('[playNotificationSound] AudioContext no disponible');
      return;
    }

    const audioContext = new AudioContext();
    
    console.log('[playNotificationSound] AudioContext state:', audioContext.state);

    // Función para reproducir el pip suave
    const playSound = () => {
      console.log('[playNotificationSound] 🔊 Pip suave...');
      playBuzz(audioContext, 0);
    }

    // Si el contexto está suspendido, reanudarlo
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('[playNotificationSound] AudioContext reanudado');
        playSound();
      }).catch((e: any) => {
        console.error('[playNotificationSound] Error al reanudar:', e);
        playSound();
      });
    } else {
      playSound();
    }
  } catch (error) {
    console.error('[playNotificationSound] Error fatal:', error);
  }
}

function playBuzz(audioContext: any, delay: number) {
  try {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sonido más amigable: frecuencia más baja, más suave
      oscillator.frequency.value = 600; // Hz (más agudo/amigable)
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime;
      const duration = 0.2; // 200ms - un "pip" corto
      
      // Envelope suave: fade in (30ms), mantener (140ms), fade out (30ms)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.03);  // Fade in
      gainNode.gain.setValueAtTime(0.3, startTime + 0.17);           // Mantener
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Fade out
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
      
      console.log('[playBuzz] ✅ Pip reproducido (200ms @ 600Hz)');
    }, delay);
  } catch (error) {
    console.error('[playBuzz] Error:', error);
  }
}
