<script setup>
import {computed} from 'vue'
import {scaleLinear,max} from 'd3'
const props=defineProps({items:Array,metric:String,title:String,subtitle:String,colors:Object,otherRanks:Object})
const emit=defineEmits(['hover','leave','select'])
const scale=computed(()=>scaleLinear().domain([0,max(props.items,d=>d[props.metric])||1]).range([0,100]))
const fmt=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(props.metric==='spend'?v/100:v)
const image=p=>p.imageData|| (p.image?`${import.meta.env.BASE_URL}items/${p.image}`:null)
</script>
<template>
 <div class="ranking">
 <div class="ranking-head"><div><span :class="['metric-dot',metric]"></span><strong>{{title}}</strong><p>{{subtitle}}</p></div><span>{{metric==='spend'?'₽':'шт.'}}</span></div>
 <button v-for="(p,i) in items" :key="p.id" class="product-row" @mouseenter="emit('hover',p,$event)" @mouseleave="emit('leave')" @focus="emit('hover',p,$event)" @blur="emit('leave')" @click="emit('select',p)">
 <span class="rank">{{String(i+1).padStart(2,'0')}}</span><span class="product-photo"><img v-if="image(p)" :src="image(p)" :alt="p.name" loading="lazy"><span v-else>◇</span></span>
 <span class="product-copy"><span class="product-name">{{p.name}}</span><span class="product-category"><i :style="{background:colors[p.category]}"></i>{{p.category}} <span class="other-rank">· №{{otherRanks[p.id]}} {{metric==='spend'?'по штукам':'по расходам'}}</span></span><svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="4" rx="2" fill="#eef0ea"/><rect :width="scale(p[metric])" height="4" rx="2" :fill="metric==='spend'?'#ed8b49':'#159e8e'"/></svg></span>
 <span class="product-number">{{fmt(p[metric])}}<small>{{metric==='spend'?'₽':'шт.'}}</small></span>
 </button>
 <div v-if="!items.length" class="empty">Нет товаров в выбранном периоде. Для услуг используйте таблицу категорий.</div>
 </div>
</template>
