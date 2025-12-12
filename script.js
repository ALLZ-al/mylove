const BLOW_THRESHOLD = 200; 
const FFT_SIZE = 256;       

const flame = document.getElementById('flame');
const instruction = document.getElementById('instruction-message');
const cakeContainer = document.getElementById('torta');
const cardsContainer = document.getElementById('cards-container');

let audioContext;
let analyser;
let micStream;
let dataArray;
let isListening = false;
let candleIsLit = true;

const canvas = document.getElementById("confetti-canvas"); 
const ctx = canvas.getContext("2d");

let cw = window.innerWidth;
let ch = window.innerHeight;
canvas.width = cw;
canvas.height = ch;

let papeles = []; 
let conteo = 100; 
let confetiActivo = false; 

class Papeles {
    constructor (x, y){
        this.x = x;
        this.y = y;
        this.color = this.colores();
        this.angulo = Math.random() * 360;
        this.vy = Math.floor(Math.random() * 1) + 2; 
        this.girar = Math.random() < 0.5 ? -1 : 1;
        this.vx = (Math.random() - 0.5) * 5; 
    }
    
    colores(){
        let r = Math.floor(Math.random() * 255);
        let g = Math.floor(Math.random() * 255);
        let b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.9)`; 
    }

    draw(){
        const alto = 15;
        const ancho = 8;
        
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angulo * Math.PI / 180 * this.girar); 
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, alto, ancho);
        ctx.fill();
        ctx.closePath();
        ctx.restore();

        this.angulo += 5; 
        this.y += this.vy;
        this.x += this.vx; 
 
        if (this.y > ch || this.x < 0 || this.x > cw) {
            this.x = Math.floor(Math.random() * cw);
            this.y = -alto; 
            this.color = this.colores(); 
        }
    }
}

let updateConfeti = () => {
    if (!confetiActivo) return; 

    ctx.clearRect(0, 0, cw, ch);

    papeles.forEach((papel) => {
        papel.draw();
    });

    requestAnimationFrame(updateConfeti);
}



function launchConfeti() {

    for (let i = 0; i < conteo; i++) {
       
        let x = Math.floor(Math.random() * cw);
        let y = Math.floor(Math.random() * ch * -1); 
        papeles.push(new Papeles(x, y));
    }
    
    confetiActivo = true;
    updateConfeti();

  
    setTimeout(() => {
        confetiActivo = false;
        ctx.clearRect(0, 0, cw, ch); 
        papeles = []; 
    }, 50000); 
}

function startListening() {
    if (isListening) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    
    audioContext.resume().then(() => {
        console.log("AudioContext reanudado.");
        
        
        analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        dataArray = new Uint8Array(analyser.fftSize);

      
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                
                micStream = stream;
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                isListening = true;
                instruction.textContent = "¡Vela encendida! ¡Sopla fuerte para apagarla!";
                checkMicLevel();
            })
            .catch(err => {
            
                instruction.textContent = `Error: Micrófono bloqueado. Revisa la configuración del navegador.`;
                console.error("Error al acceder al micrófono:", err);
            });
    })
    .catch(err => {
        instruction.textContent = "Error al iniciar el audio. Intenta recargar y tocar de nuevo.";
        console.error("Error en AudioContext resume:", err);
    });
    
    document.removeEventListener('click', startListening);
}



function checkMicLevel() {
    if (!isListening || !candleIsLit) return;

    analyser.getByteTimeDomainData(dataArray);

    let sumOfSquares = 0;
    for (const amplitude of dataArray) {
        const normalized = amplitude / 128 - 1; 
        sumOfSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumOfSquares / dataArray.length) * 1000; 

    if (rms > BLOW_THRESHOLD) {
        blowOutCandle();
    } 

    requestAnimationFrame(checkMicLevel);
}

function blowOutCandle() {
    candleIsLit = false;
    flame.classList.remove('on');
    flame.classList.add('off');
    
    micStream.getTracks().forEach(track => track.stop());    
    instruction.textContent = "¡WUUUUU! 🎉 FELIZ CUMPLEEEEE ♡";
    launchConfeti();
    
}


document.addEventListener('click', startListening, { once: true });
instruction.textContent = "Toca la pantalla para encender la vela y activar el micrófono";