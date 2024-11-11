<template>
  <div class="w-full" ref="container">
    <section class="sticky" ref="stickyRef">
      <div class="hand-container" ref="handContainerRef">
        <div class="hand" ref="handRef">
          <div class="hand-image" ref="handImageRef"></div>
        </div>
      </div>

      <div class="intro" ref="introRef">
        <h1 ref="h1ElementRef">
          <span>time to</span> be productive
        </h1>
        <div class="intro-copy" ref="introCopyRef">
          <p>Track your focus sessions with our Pomodoro timer</p>
          <p>Stay productive, achieve more</p>
        </div>
      </div>

      <div class="website-content" ref="websiteContentRef">
        <h1>Productiv</h1>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

const router = useRouter()

const container = ref(null)
const stickyRef = ref(null)
const handContainerRef = ref(null)
const handRef = ref(null)
const handImageRef = ref(null)
const introRef = ref(null)
const h1ElementRef = ref(null)
const introCopyRef = ref(null)
const websiteContentRef = ref(null)

const headers = [
  '<span>time to</span> be productive',
  '<span>time to</span> stay focused',
  '<span>time to</span> level up',
  '<span>time to</span> compete',
  '<span>time to</span> get started',
  '<span>time to</span> begin',
  '<span>time to</span> shine',
  '<span>time to</span> login',
]

onMounted(() => {
  let currentHeader = -1
  let imageShown = false
  let hasRedirected = false

  const updateHeader = () => {
    if (h1ElementRef.value) {
      h1ElementRef.value.innerHTML = headers[Math.min(currentHeader, headers.length - 1)]
    }
  }

  ScrollTrigger.create({
    trigger: stickyRef.value,
    start: 'top top',
    end: '+=800%',
    pin: true,
    scrub: 1,
    pinSpacing: true,
    markers: {
      startColor: "black",
      endColor: "black",
      indent: 20  
    },
    onUpdate: (self) => {
      const progress = self.progress

      // Redirect logic
      if (progress >= 0.99 && !hasRedirected) {
        hasRedirected = true
        setTimeout(() => {
          router.push('/login')
        }, 500)
      }

      // Modified rotation and header update logic
      const rotation = progress * 1440 // Reduced total rotation for smoother transitions
      const currentRotation = rotation - 90
      gsap.set(handContainerRef.value, {
        rotation: currentRotation
      })

      // Update header every 180 degrees
      const newHeader = Math.floor((currentRotation + 90) / 180)
      if (newHeader !== currentHeader && newHeader >= 0 && newHeader < headers.length) {
        currentHeader = newHeader
        
        // Fade out current text
        gsap.to(h1ElementRef.value, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            // Update text and fade in
            updateHeader()
            gsap.to(h1ElementRef.value, {
              opacity: 1,
              duration: 0.2
            })
          }
        })

        // Image reveal logic
        if (newHeader === 3 && !imageShown) {
          gsap.to(handImageRef.value, {
            opacity: 1,
            duration: 0.3
          })
          gsap.to(introCopyRef.value.querySelectorAll('p'), {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1
          })
          imageShown = true
        } else if (newHeader !== 3 && imageShown) {
          gsap.to(handImageRef.value, {
            opacity: 0,
            duration: 0.3
          })
          gsap.to(introCopyRef.value.querySelectorAll('p'), {
            x: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1
          })
          imageShown = false
        }
      }

      // Scale and fade animations
      if (progress < 0.75) {
        const scaleProgress = gsap.utils.clamp(0, 1, (progress - 0.5) / 0.25)
        gsap.set(handRef.value, {
          scale: 1 + (scaleProgress * 19),
          opacity: 1 - scaleProgress
        })
        gsap.set(introRef.value, {
          opacity: 1 - scaleProgress
        })
      }

      // Final content reveal
      if (progress > 0.75) {
        gsap.set(websiteContentRef.value, {
          opacity: gsap.utils.clamp(0, 1, (progress - 0.75) / 0.25)
        })
        window.location.href = '/login'
      }
    }
  })

  updateHeader()
})

onUnmounted(() => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill())
})
</script>

<style scoped>
:root {
  background: #000;
}

.sticky {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.hand-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hand {
  position: relative;
  width: 2px;
  height: 52.75%;
  transform-origin: center;
  background: #fff;
  margin: 0 auto;
  left: 0;
  box-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.hand-image {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  opacity: 0;
  background: #666;
  border-radius: 50%;
}

.intro {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
  max-width: 800px;
  padding: 0 20px;
  z-index: 10;
}

.intro h1 {
  font-size: 4rem;
  margin-bottom: 2rem;
  transition: opacity 0.2s ease;
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}

.intro span {
  display: block;
  font-size: 1.5rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
  color: #fff;
}

.intro-copy p {
  opacity: 0;
  transform: translateX(20px);
  margin: 1rem 0;
  color: #fff;
}

.website-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  text-align: center;
  z-index: 20;
}

.about {
  min-height: 100vh;
  padding: 100px 20px;
  background: #000;
  color: #fff;
}
</style>