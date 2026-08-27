<template>
  <div class="card links-card">
    <div class="card-header">
      <span class="title">🔗 项目链接</span>
    </div>
    <div class="links-grid">
      <a
        v-for="link in store.siteLinks"
        :key="link.id"
        :href="link.url"
        target="_blank"
        class="link-item"
      >
        <Icon size="24">
          <component :is="getIcon(link.icon)" />
        </Icon>
        <span class="name">{{ link.name }}</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/store'
import { Icon } from '@vicons/utils'
import { Link as LinkIcon, Book, Code, User, Heart, Image, Folder } from '@vicons/fa'

const store = useMainStore()

const getIcon = (name) => {
  const icons = {
    link: LinkIcon,
    blog: Book,
    project: Code,
    about: User,
    heart: Heart,
    photo: Image,
    folder: Folder
  }
  return icons[name] || LinkIcon
}
</script>

<style lang="scss" scoped>
.links-card {
  .links-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .link-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: $border-radius-sm;
      transition: $transition;

      &:hover {
        background: rgba(0, 212, 255, 0.1);
        transform: translateX(4px);

        .name {
          color: $primary;
        }
      }

      .name {
        font-size: 14px;
        color: $text;
        transition: $transition;
      }
    }
  }
}
</style>
