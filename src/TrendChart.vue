<script setup>
import {computed,ref,onMounted,onBeforeUnmount} from 'vue'
import {scaleLinear,scalePoint,line,area,max} from 'd3'
const props=defineProps({data:Array,metric:String,color:{default:'#5264ff'},unit:String,title:String,small:Boolean})
const hover=ref(null),container=ref(null),width=ref(680)
let observer
onMounted(()=>{observer=new ResizeObserver(entries=>width.value=Math.max(240,entries[0].contentRect.width));observer.observe(container.value)})
onBeforeUnmount(()=>observer?.disconnect())
const W=computed(()=>width.value),H=computed(()=>props.small?156:242),left=computed(()=>props.small?12:57),right=16,top=20,bottom=34
const x=computed(()=>scalePoint().domain(props.data.map(d=>d.key)).range([left.value,W.value-right]))
const value=d=>d[props.metric]
const y=computed(()=>scaleLinear().domain([0,max(props.data,d=>value(d))||1]).nice().range([H.value-bottom,top]))
const path=computed(()=>line().defined(d=>value(d)!=null).x(d=>x.value(d.key)).y(d=>y.value(value(d)))(props.data))
const fill=computed(()=>area().defined(d=>value(d)!=null).x(d=>x.value(d.key)).y0(H.value-bottom).y1(d=>y.value(value(d)))(props.data))
const ticks=computed(()=>{const stride=Math.max(1,Math.ceil(props.data.length/Math.max(2,Math.floor(W.value/110))));return props.data.filter((_,i)=>i%stride===0&&i<props.data.length-stride/2||i===props.data.length-1)})
const fmt=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:props.unit==='%'?1:0,notation:(props.unit==='₽'?v/100:v)>=10000?'compact':'standard'}).format(props.unit==='₽'?v/100:v)
const label=k=>new Date((k.length===10?k:k+'-01')+'T00:00:00Z').toLocaleDateString('ru-RU',{day:k.length===10?'numeric':undefined,month:'short',year:k.length===10?undefined:'2-digit',timeZone:'UTC'})
</script>
<template>
 <div class="trend-wrap" ref="container">
 <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="title||'Покупки по месяцам'" @mouseleave="hover=null">
  <g v-if="!small" v-for="v in y.ticks(4)" :key="v"><line :x1="left" :x2="W-right" :y1="y(v)" :y2="y(v)" stroke="#e8eaf1"/><text :x="left-9" :y="y(v)+4" text-anchor="end" class="axis-label">{{fmt(v)}}</text></g>
  <path :d="fill" :fill="color" opacity=".06"/><path :d="path" fill="none" :stroke="color" stroke-width="2.5" stroke-linejoin="round"/>
  <text v-for="d in ticks" :key="d.key" :x="x(d.key)" :y="H-8" :text-anchor="d===data[0]?'start':d===data[data.length-1]?'end':'middle'" class="axis-label">{{label(d.key)}}</text>
  <g v-for="d in data" :key="d.key"><circle v-if="value(d)!=null" :cx="x(d.key)" :cy="y(value(d))" :r="hover===d?5:2.5" :fill="color"/><rect :x="x(d.key)-Math.min(12,(W-left-right)/Math.max(1,data.length)/2)" y="0" :width="Math.min(24,(W-left-right)/Math.max(1,data.length))" :height="H-bottom" fill="transparent" @mouseenter="hover=d" @click="hover=hover===d?null:d"><title>{{label(d.key)}}: {{value(d)==null?'Нет покупок':fmt(value(d))+' '+unit}}</title></rect></g>
  <g v-if="hover"><line :x1="x(hover.key)" :x2="x(hover.key)" :y1="top" :y2="H-bottom" :stroke="color" opacity=".3"/></g>
 </svg>
 <div v-if="hover" class="chart-readout">{{label(hover.key)}} · {{value(hover)==null?'Нет покупок':fmt(value(hover))+' '+unit}}</div>
 </div>
</template>
