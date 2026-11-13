<template>
  <div class="space-y-6 pb-16">
    <!-- Executive Page Header -->
    <PageHeader icon="config" title="Mobile App Studio & Experience Config">
      <div class="flex items-center gap-2">
        <span
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live & Synced with App
        </span>
        <AppButton variant="secondary" size="sm" @click="previewOpen = true">
          <Eye class="w-4 h-4 mr-1.5" />
          Preview in App
        </AppButton>
        <AppButton :loading="isSaving" @click="onSave">
          <Save class="w-4 h-4 mr-1.5" />
          Save changes
        </AppButton>
      </div>
    </PageHeader>

    <MobilePreviewPanel v-model="previewOpen" />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 space-y-3">
      <AppSpinner size="lg" />
      <p class="text-sm font-medium text-ink-muted">Loading configuration studio...</p>
    </div>

    <template v-else-if="isLoaded">
      <!-- Search & Quick Navigation Bar (Zoho / Stripe style) -->
      <div class="relative">
        <div class="relative flex items-center">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search all settings (e.g. 'home sections', 'privacy', 'giving amounts', 'scripture', 'referral', 'faqs')..."
            class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-hover text-ink-muted hover:text-ink"
            @click="searchQuery = ''"
          >
            Clear
          </button>
        </div>

        <!-- Search Results Dropdown -->
        <div
          v-if="searchQuery.trim() && searchResults.length > 0"
          class="absolute z-20 left-0 right-0 mt-2 p-2 rounded-xl border border-border bg-surface-elevated shadow-xl space-y-1 max-h-72 overflow-y-auto"
        >
          <button
            v-for="res in searchResults"
            :key="res.id"
            type="button"
            class="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-hover text-left transition-colors"
            @click="selectSearchResult(res)"
          >
            <div class="flex items-center gap-3">
              <component :is="res.icon" class="w-4 h-4 text-primary shrink-0" />
              <div>
                <p class="text-xs font-bold text-ink">{{ res.title }}</p>
                <p class="text-[11px] text-ink-muted">{{ res.description }}</p>
              </div>
            </div>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface text-ink-muted border border-border">
              {{ res.categoryLabel }}
            </span>
          </button>
        </div>
      </div>

      <!-- 4 High-Level Pillar Cards (Executive Information Architecture) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          v-for="cat in CONFIG_CATEGORIES"
          :key="cat.id"
          type="button"
          :class="[
            'text-left p-4 rounded-2xl border transition-all relative overflow-hidden group',
            activeCategory === cat.id
              ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/5 ring-1 ring-primary/40'
              : 'border-border bg-surface hover:bg-surface-hover/80 hover:border-border-strong',
          ]"
          @click="selectCategory(cat.id)"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div
              :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-surface-hover text-ink-muted group-hover:text-ink border border-border',
              ]"
            >
              <component :is="cat.icon" class="w-5 h-5" />
            </div>
            <span
              v-if="cat.badge(config)"
              class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              :class="activeCategory === cat.id ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-hover text-ink-muted border-border'"
            >
              {{ cat.badge(config) }}
            </span>
          </div>
          <h3 class="text-sm font-bold text-ink tracking-tight">{{ cat.title }}</h3>
          <p class="text-xs text-ink-muted mt-1 leading-snug line-clamp-2">{{ cat.description }}</p>
          <div
            v-if="activeCategory === cat.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          />
        </button>
      </div>

      <!-- Sub-Navigation Pills for the Active Pillar -->
      <div class="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto no-scrollbar">
        <button
          v-for="subTab in currentCategory.subTabs"
          :key="subTab.id"
          type="button"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0',
            activeTab === subTab.id
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-surface text-ink-muted hover:text-ink hover:bg-surface-hover border border-border',
          ]"
          @click="setTab(subTab.id)"
        >
          <component :is="subTab.icon" class="w-3.5 h-3.5" />
          <span>{{ subTab.label }}</span>
          <span
            v-if="subTab.count && subTab.count(config) !== undefined"
            :class="[
              'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
              activeTab === subTab.id ? 'bg-white/25 text-white' : 'bg-surface-hover text-ink-muted',
            ]"
          >
            {{ subTab.count(config) }}
          </span>
        </button>
      </div>

      <!-- TAB CONTENT AREA -->

      <!-- ============================================================== -->
      <!-- PILLAR 1: APP LAYOUT & FEEDS                                  -->
      <!-- ============================================================== -->

      <!-- Layout Sections (Home, Videos, Player, Library) -->
      <div v-if="activeTab === 'layout'" class="space-y-6">
        <!-- Human-centric Guide Banner -->
        <AppCard class="p-4 bg-gradient-to-r from-primary/10 via-surface to-surface border-primary/20">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Layers class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-ink">App Shelves & Catalog Layout</h3>
                <p class="text-xs text-ink-muted">
                  Control which horizontal shelves show up on the Mobile, Tablet, Web, and Smart TV Home feeds.
                  Drag and drop to rearrange order.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <AppButton variant="secondary" size="xs" @click="expandAllSections('homeSections')">
                <ChevronsDown class="w-3.5 h-3.5 mr-1" /> Expand all
              </AppButton>
              <AppButton variant="secondary" size="xs" @click="collapseAllSections('homeSections')">
                <ChevronsUp class="w-3.5 h-3.5 mr-1" /> Collapse all
              </AppButton>
              <AppButton variant="primary" size="xs" @click="addSection('homeSections')">
                + Add Home Section
              </AppButton>
            </div>
          </div>
        </AppCard>

        <!-- Landing Header -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Landing Header & Welcome Copy</h3>
              <p class="text-xs text-ink-muted">Shown in the hero area when there's no active live stream or featured spotlight item.</p>
            </div>
            <span class="text-[11px] font-semibold text-ink-muted px-2 py-0.5 rounded bg-surface border border-border">Home Tab Fallback</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="config.hero.fallbackTitle" label="Hero Title" placeholder="Start your worship stream" />
            <AppInput v-model="config.hero.fallbackSubtitle" label="Hero Subtitle" placeholder="Music, videos, and live moments." />
          </div>
        </AppCard>

        <!-- Latest Releases & Premieres Spotlight Section Card -->
        <AppCard class="p-5 space-y-4 border-primary/30 bg-primary/5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-ink">Latest Releases & Premieres Section</h3>
                <p class="text-xs text-ink-muted">
                  Controls the spotlight release banner and dedicated release shelves across the mobile app.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <RouterLink to="/content/new">
                <AppButton size="xs" variant="primary">
                  + New Release
                </AppButton>
              </RouterLink>
              <RouterLink to="/content">
                <AppButton size="xs" variant="secondary">
                  Manage Content
                </AppButton>
              </RouterLink>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-surface p-3.5 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    :class="hasLatestSectionInHome ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-surface-hover text-ink-muted border border-border'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="hasLatestSectionInHome ? 'bg-emerald-400 animate-pulse' : 'bg-ink-muted'" />
                    {{ hasLatestSectionInHome ? 'Active on Home Tab' : 'Not yet added to Home Sections' }}
                  </span>
                  <span class="text-xs text-ink-muted font-mono">section: latest-releases</span>
                </div>
                <p class="text-xs text-ink-muted mt-1 leading-relaxed">
                  Tag any audio track, video, or premiere with <code class="px-1.5 py-0.5 rounded bg-surface-strong text-primary font-mono text-[11px]">latest-releases</code> in Content Library to feature it prominently on the mobile app.
                </p>
              </div>
              <AppButton
                v-if="!hasLatestSectionInHome"
                size="xs"
                variant="secondary"
                @click="addLatestReleaseSectionToHome"
              >
                + Add to Home Sections
              </AppButton>
            </div>
          </div>
        </AppCard>

        <!-- Configured Sections Groups -->
        <div v-for="group in MOBILE_LAYOUT_GROUPS" :key="group.key" class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-ink">{{ group.title }} Screen Shelves</h3>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {{ config.layout[group.key]?.length ?? 0 }} shelves
                </span>
              </div>
              <p class="text-xs text-ink-muted mt-0.5">{{ group.description }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="text-xs text-ink-muted hover:text-ink font-semibold px-2 py-1 rounded hover:bg-surface-hover transition-colors"
                @click="expandAllSections(group.key)"
              >
                Expand all
              </button>
              <button
                type="button"
                class="text-xs text-ink-muted hover:text-ink font-semibold px-2 py-1 rounded hover:bg-surface-hover transition-colors"
                @click="collapseAllSections(group.key)"
              >
                Collapse all
              </button>
              <AppButton variant="secondary" size="xs" @click="addSection(group.key)">+ Add shelf</AppButton>
            </div>
          </div>

          <!-- Section Cards with Drag & Drop -->
          <div class="space-y-3">
            <div
              v-for="(section, idx) in config.layout[group.key]"
              :key="section.id"
              :draggable="true"
              @dragstart="handleDragStart(group.key, idx, $event)"
              @dragover.prevent="handleDragOver(group.key, idx, $event)"
              @dragenter.prevent="handleDragEnter(group.key, idx)"
              @drop="handleDrop(group.key, idx)"
              @dragend="handleDragEnd"
              :class="[
                'rounded-xl transition-all duration-150',
                sectionDrag.groupKey === group.key && sectionDrag.fromIndex === idx
                  ? 'opacity-30 border-dashed border-2 border-primary scale-[0.99]'
                  : '',
                sectionDrag.groupKey === group.key && sectionDrag.overIndex === idx && sectionDrag.fromIndex !== idx
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-md'
                  : ''
              ]"
            >
              <AppCard class="p-0 border border-border hover:border-border-strong overflow-hidden shadow-sm">
                <!-- Card Header Row (Interactive & clear) -->
                <div
                  class="flex items-center justify-between gap-3 p-3.5 select-none transition-colors rounded-t-[var(--radius-card)]"
                  :class="isSectionExpanded(section.id) ? 'bg-surface-hover/70 border-b border-border/60' : 'hover:bg-surface-hover/50'"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      class="cursor-grab active:cursor-grabbing p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                      title="Drag to reorder section"
                      aria-label="Drag to reorder section"
                    >
                      <GripVertical class="w-4 h-4" />
                    </button>
                    <span class="text-xs font-mono font-bold text-ink-muted bg-surface px-1.5 py-0.5 rounded border border-border/60">
                      #{{ idx + 1 }}
                    </span>
                    <button
                      type="button"
                      class="flex items-center gap-2 text-left min-w-0"
                      @click="toggleSectionExpanded(section.id)"
                    >
                      <span class="text-sm font-bold text-ink truncate">{{ section.title || 'Untitled Section' }}</span>
                      <span class="hidden sm:inline-flex text-[11px] font-mono text-ink-muted px-2 py-0.5 rounded bg-surface border border-border/40">
                        Tag: {{ section.title || section.id }}
                      </span>
                    </button>
                    <!-- Content Type Pills -->
                    <div class="hidden md:flex items-center gap-1">
                      <span
                        v-for="ct in section.contentTypes"
                        :key="ct"
                        class="text-[10px] font-semibold px-2 py-0.2 rounded-full capitalize"
                        :class="getContentTypeChipClass(ct)"
                      >
                        {{ ct }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      :disabled="idx === 0"
                      title="Move to top"
                      @click="moveSectionToTop(group.key, idx)"
                    >
                      <ChevronsUp class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      :disabled="idx === 0"
                      title="Move up"
                      @click="moveSectionUp(group.key, idx)"
                    >
                      <ArrowUp class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      :disabled="idx === (config.layout[group.key]?.length ?? 0) - 1"
                      title="Move down"
                      @click="moveSectionDown(group.key, idx)"
                    >
                      <ArrowDown class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      :disabled="idx === (config.layout[group.key]?.length ?? 0) - 1"
                      title="Move to bottom"
                      @click="moveSectionToBottom(group.key, idx)"
                    >
                      <ChevronsDown class="w-3.5 h-3.5" />
                    </button>
                    <span class="w-px h-3.5 bg-border mx-0.5" />
                    <button
                      type="button"
                      class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                      :title="isSectionExpanded(section.id) ? 'Collapse' : 'Expand'"
                      @click="toggleSectionExpanded(section.id)"
                    >
                      <ChevronUp v-if="isSectionExpanded(section.id)" class="w-4 h-4" />
                      <ChevronDown v-else class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="text-xs text-danger hover:text-danger-strong font-medium px-2 py-1 rounded hover:bg-danger/10 transition-colors ml-1"
                      @click="removeSection(group.key, idx)"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <!-- Collapsible Form Body -->
                <div v-show="isSectionExpanded(section.id)" class="p-4 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AppInput v-model="section.title" label="Section Title" placeholder="e.g. ClaudyGod Music" />
                    <AppInput v-model="section.subtitle" label="Subtitle" placeholder="e.g. Latest afro-gospel releases" />
                  </div>

                  <!-- Accepted Content Types -->
                  <div>
                    <label class="block text-xs font-bold text-ink mb-1.5">
                      Accepted Content Types (at least one required)
                    </label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="ct in MOBILE_CONTENT_TYPE_OPTIONS"
                        :key="ct"
                        type="button"
                        :class="[
                          'px-3 py-1 rounded-lg text-xs font-semibold capitalize border transition-all',
                          section.contentTypes.includes(ct)
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-hover text-ink-muted border-border hover:text-ink',
                        ]"
                        @click="toggleContentType(section, ct)"
                      >
                        {{ ct }}
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <AppInput v-model="section.actionLabel" label="Button Label" placeholder="Open" />
                    <AppSelect v-model="section.destinationTab" label="Destination Tab" :options="MOBILE_TAB_DESTINATION_OPTIONS_ARR" />
                    <AppInput
                      v-model.number="section.maxItems"
                      type="number"
                      label="Items shown in section rail"
                      placeholder="50"
                      hint="Item limit for rail (e.g. 50, up to 100). Additional items accessible via See all."
                      :min="MOBILE_SECTION_RAIL_MIN_ITEMS"
                      max="100"
                    />
                  </div>

                  <!-- Tagging Advice & Diagnostic Test -->
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/60">
                    <p class="text-xs text-ink-muted leading-relaxed">
                      Tag items with: <code class="px-2 py-0.5 rounded bg-surface font-mono text-primary font-bold border border-border">{{ section.title || section.id }}</code> under Content Library.
                    </p>
                    <div class="flex items-center gap-2">
                      <span
                        v-if="sectionDiagnostics[diagnosticKey(group.key, section.id)]"
                        class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                      >
                        {{ sectionDeliverySummary(group.key, section) }}
                      </span>
                      <AppButton
                        variant="secondary"
                        size="xs"
                        :loading="diagnosticLoadingKey === diagnosticKey(group.key, section.id)"
                        @click="verifySection(group.key, section.id)"
                      >
                        Verify published content
                      </AppButton>
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>

            <AppButton variant="secondary" size="sm" @click="addSection(group.key)">+ Add new shelf to {{ group.title }}</AppButton>
          </div>
        </div>
      </div>

      <!-- Discovery & Search Filters -->
      <div v-if="activeTab === 'discovery'" class="space-y-6">
        <AppCard class="p-5 space-y-4">
          <div>
            <h3 class="text-sm font-bold text-ink">Search Filter Categories</h3>
            <p class="text-xs text-ink-muted">Comma-separated list of media categories presented in the search drawer.</p>
          </div>
          <AppInput v-model="categoriesText" label="Categories" placeholder="audio, video, live, playlist" />
        </AppCard>

        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Discovery Quick Search Shortcuts</h3>
              <p class="text-xs text-ink-muted">Tappable shortcut pills on the search screen that pre-fill search queries.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addShortcut">+ Add Shortcut</AppButton>
          </div>

          <div class="space-y-3">
            <div
              v-for="(sc, i) in config.discovery.shortcuts"
              :key="sc.id"
              class="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 rounded-xl border border-border bg-surface sm:items-end"
            >
              <AppInput v-model="sc.icon" label="Icon" placeholder="travel-explore" />
              <AppInput v-model="sc.label" label="Shortcut Label" placeholder="Worship" />
              <AppInput v-model="sc.query" label="Search Query" placeholder="worship" />
              <AppSelect v-model="sc.category" label="Category" :options="DISCOVERY_CATEGORY_OPTIONS_ARR" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeShortcut(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Bottom App Navigation -->
      <div v-if="activeTab === 'navigation'" class="space-y-4">
        <AppCard class="p-5 space-y-3">
          <h3 class="text-sm font-bold text-ink">Bottom Tab Bar Navigation</h3>
          <p class="text-xs text-ink-muted">
            The core app navigation tabs. Tab destinations are native-enforced for stability; you can customize the public labels and icons below.
          </p>
        </AppCard>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AppCard v-for="tab in config.navigation.tabs" :key="tab.id" class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-primary uppercase px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                Tab: {{ tab.id }}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput v-model="tab.label" label="Display Label" placeholder="Home" />
              <AppInput v-model="tab.icon" label="Icon Name" placeholder="home-filled" />
            </div>
          </AppCard>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- PILLAR 2: GIVING & STEWARDSHIP                                -->
      <!-- ============================================================== -->

      <!-- Donate: Plans, Currencies & Methods -->
      <div v-if="activeTab === 'donate'" class="space-y-6">
        <!-- Currency & Options -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Currency Settings</h3>
              <p class="text-xs text-ink-muted">Set default operating currency and international options for the giving flow.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addCurrencyOption">+ Add Currency Option</AppButton>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput v-model="config.donate.currency" label="Default Global Currency" placeholder="USD" />
          </div>

          <div class="space-y-2 pt-2 border-t border-border">
            <p class="text-xs font-bold text-ink">Supported Currency Tiers</p>
            <div
              v-for="(opt, i) in config.donate.currencyOptions ?? []"
              :key="i"
              class="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-border bg-surface sm:items-end"
            >
              <AppInput v-model="opt.code" label="Code (e.g. USD)" placeholder="USD" />
              <AppInput v-model="opt.label" label="Label" placeholder="US Dollar" />
              <AppInput v-model="opt.symbol" label="Symbol" placeholder="$" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeCurrencyOption(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>

        <!-- Quick Amounts -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Quick Giving Amounts</h3>
              <p class="text-xs text-ink-muted">Presets presented to givers for instant 1-tap giving.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addQuickAmount">+ Add Amount Preset</AppButton>
          </div>

          <div class="flex flex-wrap gap-2">
            <div v-for="(_, i) in config.donate.quickAmounts" :key="i" class="flex gap-1.5 items-center bg-surface p-1.5 rounded-xl border border-border">
              <AppInput v-model="config.donate.quickAmounts[i]" placeholder="$25" class="w-24" />
              <AppButton variant="ghost" size="sm" class="text-danger" @click="removeQuickAmount(i)">✕</AppButton>
            </div>
          </div>

          <div v-if="(config.donate.currencyOptions ?? []).length" class="space-y-3 pt-3 border-t border-border">
            <h4 class="text-xs font-bold text-ink">Quick amounts by currency</h4>
            <div v-for="opt in config.donate.currencyOptions ?? []" :key="opt.code" class="space-y-2 p-3 rounded-xl border border-border bg-surface">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-primary uppercase tracking-wide">{{ opt.code }} ({{ opt.symbol }})</p>
                <AppButton variant="secondary" size="xs" @click="addQuickAmountForCurrency(opt.code)">+ Add {{ opt.code }} Amount</AppButton>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="(_, i) in (config.donate.quickAmountsByCurrency ?? {})[opt.code] ?? []" :key="i" class="flex gap-1.5 items-center bg-surface-hover p-1 rounded-lg border border-border">
                  <AppInput v-model="(config.donate.quickAmountsByCurrency ?? {})[opt.code]![i]" class="w-24" />
                  <AppButton variant="ghost" size="sm" class="text-danger" @click="removeQuickAmountForCurrency(opt.code, i)">✕</AppButton>
                </div>
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Payment Methods -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-ink">Giving Payment Methods</h3>
              <p class="text-xs text-ink-muted">Card, Apple Pay, Google Pay, Bank Transfer, and direct payment provider rails.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addDonateMethod">+ Add Payment Method</AppButton>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppCard v-for="(method, i) in config.donate.methods" :key="method.id" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AppInput v-model="method.icon" label="Icon" placeholder="credit-card" />
                  <AppInput v-model="method.label" label="Display Name" class="sm:col-span-2" placeholder="Debit / Credit Card" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeDonateMethod(i)">Remove</AppButton>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AppInput v-model="method.subtitle" label="Subtitle" placeholder="Fast checkout with secure payment providers" />
                <AppInput v-model="method.badge" label="Badge (optional)" placeholder="Recommended" />
              </div>
              <div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-hover/50 p-3">
                <div>
                  <p class="text-xs font-bold text-ink">Active in Mobile Giving</p>
                  <p class="text-[11px] text-ink-muted">Toggle visibility in the mobile app.</p>
                </div>
                <AppToggle :model-value="method.enabled" @update:model-value="(value) => (method.enabled = value)" />
              </div>
            </AppCard>
          </div>
        </div>

        <!-- Giving Plans -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-ink">Recurring Giving Plans & Ministry Partners</h3>
              <p class="text-xs text-ink-muted">Partnership tiers (Monthly, One-off, Supporter, Sponsor).</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addDonatePlan">+ Add Giving Plan</AppButton>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppCard v-for="(plan, i) in config.donate.plans" :key="plan.id" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AppInput v-model="plan.name" label="Plan Name" placeholder="Ministry Partner" />
                  <AppInput v-model="plan.amount" label="Suggested Amount" placeholder="$50" />
                  <AppSelect v-model="plan.period" label="Frequency" :options="DONATE_PLAN_PERIOD_OPTIONS_ARR" />
                  <AppInput v-model="plan.icon" label="Icon" placeholder="favorite-border" />
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span class="text-[10px] font-bold text-ink-muted">Featured</span>
                  <AppToggle :model-value="Boolean(plan.featured)" @update:model-value="(v) => (plan.featured = v)" />
                  <AppButton variant="ghost" size="xs" class="text-danger mt-1" @click="removeDonatePlan(i)">Remove</AppButton>
                </div>
              </div>
              <AppTextarea v-model="plan.note" label="Plan Impact Description" :rows="2" placeholder="Supports ClaudyGod studio production and youth outreaches." />
            </AppCard>
          </div>
        </div>

        <!-- Impact Breakdown -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Financial Impact Transparency</h3>
              <p class="text-xs text-ink-muted">Shows donors exactly how their contributions are stewarded (must total 100%).</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addImpactItem">+ Add Category</AppButton>
          </div>

          <div class="space-y-2">
            <div
              v-for="(item, i) in config.donate.impactBreakdown"
              :key="i"
              class="grid grid-cols-1 sm:grid-cols-5 gap-3 p-2.5 rounded-xl border border-border bg-surface sm:items-end"
            >
              <AppInput v-model="item.icon" label="Icon" placeholder="wifi-tethering" />
              <AppInput v-model="item.label" label="Category" class="sm:col-span-2" placeholder="Streaming & CDN" />
              <AppInput v-model.number="item.value" type="number" label="Percentage (%)" min="0" max="100" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeImpactItem(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Giving Quotes (Scripture Verses) -->
      <div v-if="activeTab === 'giving'" class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Giving Scripture Verses</h3>
              <p class="text-xs text-ink-muted">Rotating inspirational verses shown at the top of the mobile Donate screen.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addScripture">+ Add Verse</AppButton>
          </div>

          <div class="space-y-3">
            <div v-for="(_, i) in config.donate.scriptures" :key="i" class="flex gap-2 items-start p-3 rounded-xl border border-border bg-surface">
              <AppTextarea
                v-model="config.donate.scriptures[i]"
                :rows="2"
                class="flex-1"
                placeholder='"Give, and it will be given to you." — Luke 6:38'
              />
              <AppButton variant="ghost" size="sm" class="text-danger mt-1" @click="removeScripture(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- ============================================================== -->
      <!-- PILLAR 3: COMMUNITY & GROWTH                                  -->
      <!-- ============================================================== -->

      <!-- Referral Program -->
      <div v-if="activeTab === 'referral'" class="space-y-6">
        <!-- How it works -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">How Invitation Works (Step-by-step Guide)</h3>
              <p class="text-xs text-ink-muted">Guidance steps shown on the user's "Invite Friends" mobile screen.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addReferralStep">+ Add Step</AppButton>
          </div>

          <div class="space-y-3">
            <AppCard v-for="(step, idx) in config.referral.howItWorks" :key="idx" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AppInput v-model="step.icon" label="Step Icon" placeholder="share" />
                  <AppInput v-model="step.title" label="Step Title" class="sm:col-span-2" placeholder="Share your link" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeReferralStep(idx)">Remove</AppButton>
              </div>
              <AppTextarea v-model="step.body" label="Description" :rows="2" placeholder="Send your unique referral link to friends and family." />
            </AppCard>
          </div>
        </AppCard>

        <!-- Reward Tiers -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Referral Milestone Rewards</h3>
              <p class="text-xs text-ink-muted">Badges and privileges unlocked as friends join the platform.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addReferralTier">+ Add Reward Tier</AppButton>
          </div>

          <div class="space-y-3">
            <AppCard v-for="(tier, idx) in config.referral.rewardTiers" :key="idx" class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AppInput v-model="tier.icon" label="Badge Icon" placeholder="workspace-premium" />
                  <AppInput v-model.number="tier.threshold" type="number" label="Invites Needed" min="1" />
                  <AppInput v-model="tier.reward" label="Unlocked Perk / Reward" placeholder="Premium Partner Badge" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeReferralTier(idx)">Remove</AppButton>
              </div>
            </AppCard>
          </div>
        </AppCard>
      </div>

      <!-- App Store Rating -->
      <div v-if="activeTab === 'rate'" class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <div>
            <h3 class="text-sm font-bold text-ink">App Store & Play Store URLs</h3>
            <p class="text-xs text-ink-muted">Destination links for the "Rate ClaudyGod" prompt in the mobile app.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="config.rate.iosStoreUrl" label="Apple App Store URL" placeholder="https://apps.apple.com/app/id..." />
            <AppInput v-model="config.rate.androidStoreUrl" label="Google Play Store URL" placeholder="https://play.google.com/store/apps/details?id=..." />
          </div>
          <AppInput v-model="config.rate.feedbackRoute" label="In-App Feedback Fallback Route" placeholder="/settingsPage/help" />
        </AppCard>
      </div>

      <!-- AI Assistant & Intelligence -->
      <div v-if="activeTab === 'intelligence'" class="space-y-4">
        <AppCard class="p-5 space-y-4">
          <div>
            <h3 class="text-sm font-bold text-ink">AI Assistant & Personalization Engine</h3>
            <p class="text-xs text-ink-muted">Controls smart recommendation algorithms and AI assistants across the mobile app.</p>
          </div>

          <div class="space-y-3 border-t border-border pt-3">
            <div class="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
              <div>
                <p class="text-sm font-bold text-ink">Smart AI Assistant Active</p>
                <p class="text-xs text-ink-muted">Enable personalized recommendations for listeners.</p>
              </div>
              <AppToggle v-model="config.intelligence.assistantEnabled" />
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
              <div>
                <p class="text-sm font-bold text-ink">Smart Suggestion Prompts</p>
                <p class="text-xs text-ink-muted">Allows the assistant to suggest contextual lyrics and study notes.</p>
              </div>
              <AppToggle v-model="config.intelligence.adCopySuggestionsEnabled" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <AppInput v-model="config.intelligence.providerLabel" label="AI Provider Name" placeholder="ClaudyGod Intelligence" />
            <AppInput v-model="config.intelligence.defaultTone" label="Assistant Tone" placeholder="Confident, concise, ministry-safe" />
          </div>
        </AppCard>
      </div>

      <!-- Ad Placements -->
      <div v-if="activeTab === 'ads'" class="space-y-4">
        <AppCard class="p-5 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Sponsored Content & Ad Slots</h3>
              <p class="text-xs text-ink-muted">Configure monetization banners and partner ministry spotlights.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addPlacement">+ Add Slot</AppButton>
          </div>
        </AppCard>

        <div class="space-y-3">
          <AppCard v-for="(placement, i) in config.monetization.placements" :key="placement.id" class="p-4 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AppInput v-model="placement.title" label="Placement Title" placeholder="Sponsored partner banner" />
                <AppSelect v-model="placement.screen" label="Target Screen" :options="AD_PLACEMENT_SCREEN_OPTIONS_ARR" />
              </div>
              <div class="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                <AppToggle v-model="config.monetization.placements[i].enabled" />
                <AppButton variant="ghost" size="xs" class="text-danger" @click="removePlacement(i)">Remove</AppButton>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput v-model="placement.subtitle" label="Subtitle" placeholder="Promoted slot inside the mobile app experience." />
              <AppInput v-model.number="placement.maxItems" type="number" label="Max Items" min="1" max="8" />
            </div>
          </AppCard>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- PILLAR 4: BRAND, LEGAL & SUPPORT                              -->
      <!-- ============================================================== -->

      <!-- About ClaudyGod -->
      <div v-if="activeTab === 'about'" class="space-y-6">
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Ministry Version</h3>
          <AppInput v-model="config.about.versionLabel" label="Version Label" placeholder="Version 1.0.0 (Build 2026)" />
        </AppCard>

        <!-- Hero Stats -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Ministry Key Metrics</h3>
              <p class="text-xs text-ink-muted">Shown in the About section (e.g. 100K+ Streams, 50+ Countries).</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addHeroStat">+ Add Metric</AppButton>
          </div>

          <div class="space-y-2">
            <div
              v-for="(stat, i) in config.about.heroStats"
              :key="i"
              class="grid grid-cols-1 sm:grid-cols-5 gap-3 p-2.5 rounded-xl border border-border bg-surface sm:items-end"
            >
              <AppInput v-model="stat.label" label="Label" class="sm:col-span-2" placeholder="Platforms" />
              <AppInput v-model="stat.value" label="Value" class="sm:col-span-2" placeholder="Mobile + Web + TV" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeHeroStat(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>

        <!-- Feature Chips -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-ink">App Feature Highlights</h3>
            <AppButton variant="secondary" size="xs" @click="addFeatureChip">+ Add Highlight</AppButton>
          </div>
          <div class="space-y-2">
            <div
              v-for="(chip, i) in config.about.featureChips"
              :key="i"
              class="grid grid-cols-1 sm:grid-cols-5 gap-3 p-2.5 rounded-xl border border-border bg-surface sm:items-end"
            >
              <AppInput v-model="chip.icon" label="Icon" class="sm:col-span-2" placeholder="library-music" />
              <AppInput v-model="chip.label" label="Feature Label" class="sm:col-span-2" placeholder="Worship Releases" />
              <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeFeatureChip(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>

        <!-- Team -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Leadership & Ministry Team</h3>
              <p class="text-xs text-ink-muted">Founder, lead ministers, and production team.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addTeamMember">+ Add Team Member</AppButton>
          </div>

          <div class="space-y-3">
            <AppCard v-for="(member, i) in config.about.team" :key="i" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AppInput v-model="member.name" label="Full Name" placeholder="Claudy God" />
                  <AppInput v-model="member.role" label="Role / Title" placeholder="Founder & Lead Artist" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeTeamMember(i)">Remove</AppButton>
              </div>
              <AppTextarea v-model="member.desc" label="Bio / Vision" :rows="2" placeholder="Vision, music direction, and ministry drops." />
            </AppCard>
          </div>
        </AppCard>

        <SocialLinksEditor :links="config.about.social" />
      </div>

      <!-- Help & Member Support -->
      <div v-if="activeTab === 'help'" class="space-y-6">
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Online Support Center Portal</h3>
          <AppInput v-model="config.help.supportCenterUrl" label="Support Center URL" placeholder="https://claudygod.org/support" />
        </AppCard>

        <!-- Contact Channels -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Direct Support Channels</h3>
              <p class="text-xs text-ink-muted">Tappable support methods (Email, WhatsApp, Phone) shown in the app.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addHelpContact">+ Add Support Channel</AppButton>
          </div>

          <div class="space-y-3">
            <AppCard v-for="(contact, i) in config.help.contact" :key="contact.id" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AppInput v-model="contact.icon" label="Icon" placeholder="email" />
                  <AppInput v-model="contact.title" label="Channel Title" class="sm:col-span-2" placeholder="Email Support" />
                </div>
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeHelpContact(i)">Remove</AppButton>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AppInput v-model="contact.desc" label="User-facing detail" placeholder="support@claudygod.org" />
                <AppInput v-model="contact.actionUrl" label="Action URL" placeholder="mailto:support@claudygod.org" />
              </div>
            </AppCard>
          </div>
        </AppCard>

        <!-- FAQs -->
        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Frequently Asked Questions (FAQs)</h3>
              <p class="text-xs text-ink-muted">Answers to common member questions displayed inside the Help tab.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addFaq">+ Add FAQ</AppButton>
          </div>

          <div class="space-y-3">
            <AppCard v-for="(faq, i) in config.help.faqs" :key="faq.id" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <AppInput v-model="faq.q" label="Question" class="flex-1" placeholder="Playback buffering on Smart TV?" />
                <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeFaq(i)">Remove</AppButton>
              </div>
              <AppTextarea v-model="faq.a" label="Answer" :rows="2" placeholder="Ensure TV is connected via 5GHz Wi-Fi or Ethernet..." />
            </AppCard>
          </div>
        </AppCard>
      </div>

      <!-- Privacy & Data Security -->
      <div v-if="activeTab === 'privacy'" class="space-y-6">
        <AppCard class="p-5 space-y-4">
          <h3 class="text-sm font-bold text-ink">Data Protection & Privacy Contact</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="config.privacy.contactEmail" label="Official Privacy Contact Email" placeholder="privacy@claudygod.org" />
            <AppInput v-model="config.privacy.deleteConfirmPhrase" label="Account Deletion Confirmation Phrase" placeholder="I CONFIRM" />
          </div>
        </AppCard>

        <AppCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Core Privacy Principles</h3>
              <p class="text-xs text-ink-muted">Key guarantees displayed to users in the app privacy policy.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addPrivacyPrinciple">+ Add Principle</AppButton>
          </div>

          <div class="space-y-3">
            <div v-for="(_, i) in config.privacy.principles" :key="i" class="flex gap-2 items-start p-3 rounded-xl border border-border bg-surface">
              <AppTextarea v-model="config.privacy.principles[i]" :rows="2" class="flex-1" placeholder="We never sell your personal data." />
              <AppButton variant="ghost" size="sm" class="text-danger mt-1" @click="removePrivacyPrinciple(i)">Remove</AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Settings Hub (Mobile Settings Screen Quick-Access Groups) -->
      <div v-if="activeTab === 'settings'" class="space-y-6">
        <AppCard class="p-5 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-ink">Mobile Settings Quick-Access Groups</h3>
              <p class="text-xs text-ink-muted">Configure the sections and menu links displayed on the user's mobile Settings screen.</p>
            </div>
            <AppButton variant="secondary" size="xs" @click="addSettingsHubSection">+ Add Settings Group</AppButton>
          </div>
        </AppCard>

        <div class="space-y-4">
          <AppCard v-for="(section, sIdx) in config.settingsHub.sections" :key="section.id" class="p-5 space-y-4">
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <AppInput v-model="section.title" label="Group Title" class="flex-1" placeholder="e.g. Quick Access" />
              <div class="flex items-center gap-1 mt-5">
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border"
                  :disabled="sIdx === 0"
                  title="Move section up"
                  @click="moveSettingsHubSection(sIdx, sIdx - 1)"
                >
                  <ArrowUp class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border"
                  :disabled="sIdx === config.settingsHub.sections.length - 1"
                  title="Move section down"
                  @click="moveSettingsHubSection(sIdx, sIdx + 1)"
                >
                  <ArrowDown class="w-4 h-4" />
                </button>
                <span class="w-px h-4 bg-border mx-1" />
                <AppButton variant="ghost" size="xs" class="text-danger" @click="removeSettingsHubSection(sIdx)">Remove Group</AppButton>
              </div>
            </div>

            <!-- Items inside the group -->
            <div class="space-y-3">
              <div
                v-for="(item, iIdx) in section.items"
                :key="item.id"
                class="grid grid-cols-1 sm:grid-cols-6 gap-3 p-3 rounded-xl border border-border bg-surface sm:items-end"
              >
                <AppInput v-model="item.icon" label="Icon" placeholder="library-music" />
                <AppInput v-model="item.label" label="Title" placeholder="Library" />
                <AppInput v-model="item.hint" label="Subtitle" placeholder="Saved songs & playlists" />
                <AppSelect v-model="item.destination" label="Destination Route" :options="SETTINGS_DESTINATION_OPTIONS_ARR" />
                <div class="flex items-center gap-1 mb-1">
                  <button
                    type="button"
                    class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    :disabled="iIdx === 0"
                    title="Move item up"
                    @click="moveSettingsHubItem(sIdx, iIdx, iIdx - 1)"
                  >
                    <ArrowUp class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    class="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    :disabled="iIdx === section.items.length - 1"
                    title="Move item down"
                    @click="moveSettingsHubItem(sIdx, iIdx, iIdx + 1)"
                  >
                    <ArrowDown class="w-3.5 h-3.5" />
                  </button>
                </div>
                <AppButton variant="ghost" size="sm" class="text-danger mb-0" @click="removeSettingsHubItem(sIdx, iIdx)">Remove</AppButton>
              </div>
            </div>

            <AppButton variant="secondary" size="xs" @click="addSettingsHubItem(sIdx)">+ Add link to {{ section.title || 'group' }}</AppButton>
          </AppCard>
        </div>
      </div>
    </template>

    <AppEmptyState v-else-if="configError" :title="configError" message="Check your connection and try again.">
      <template #action><AppButton size="sm" @click="onRetry">Retry</AppButton></template>
    </AppEmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowDown, ArrowUp, GripVertical, ChevronDown, ChevronUp, ChevronsUp, ChevronsDown, Sparkles,
  LayoutGrid, Layers, Search, HeartHandshake, DollarSign, BookOpen, Users, Star,
  Bot, Megaphone, ShieldCheck, HelpCircle, Info, Sliders, Eye, Save,
} from 'lucide-vue-next';
import { useConfigStore } from '@/stores/config.store';
import { useUiStore } from '@/stores/ui.store';
import { getMobileSectionDiagnostic, type MobileSectionDiagnostic } from '@/api/config';
import type {
  AppConfig, MobileContentType, MobileLayoutSection, SettingsHubItem, ReferralStep, ReferralRewardTier,
  HelpContact, Faq, DonateMethod, DonatePlan,
} from '@/api/types';
import {
  MOBILE_CONTENT_TYPE_OPTIONS,
  MOBILE_SECTION_RAIL_MIN_ITEMS,
  MOBILE_TAB_DESTINATION_OPTIONS,
  DISCOVERY_CATEGORY_OPTIONS,
  AD_PLACEMENT_SCREEN_OPTIONS,
  SETTINGS_DESTINATION_OPTIONS,
  DONATE_PLAN_PERIOD_OPTIONS,
  MOBILE_LAYOUT_GROUPS,
  cloneMobileConfig,
  createLayoutSection,
  createDiscoveryShortcut,
  createAdPlacement,
  createSettingsHubSection,
  createSettingsHubItem,
  createReferralStep,
  createReferralTier,
  createHelpContact,
  createFaq,
  createHeroStat,
  createFeatureChip,
  createTeamMember,
  createCurrencyOption,
  createDonateMethod,
  createDonatePlan,
  createImpactItem,
  createDefaultMobileAppConfig,
} from '@/utils/mobileConfig';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import MobilePreviewPanel from '@/components/shared/MobilePreviewPanel.vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import SocialLinksEditor from '@/components/shared/SocialLinksEditor.vue';

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const ui = useUiStore();

// -----------------------------------------------------------------------
// Executive 4-Pillar Information Architecture (Zoho / Stripe CRM pattern)
// -----------------------------------------------------------------------

interface ConfigSubTab {
  id: string;
  label: string;
  icon: unknown;
  count?: (c: AppConfig) => number | string | undefined;
}

interface ConfigCategory {
  id: string;
  title: string;
  description: string;
  icon: unknown;
  badge: (c: AppConfig) => string;
  subTabs: ConfigSubTab[];
}

const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: 'experience',
    title: 'App Layout & Feeds',
    description: 'Home shelves, catalog sections, search filters, and tab navigation.',
    icon: LayoutGrid,
    badge: (c) => `${(c.layout?.homeSections?.length ?? 0) + (c.layout?.videoSections?.length ?? 0)} Shelves`,
    subTabs: [
      {
        id: 'layout',
        label: 'Home & Tab Shelves',
        icon: Layers,
        count: (c) => c.layout?.homeSections?.length ?? 0,
      },
      {
        id: 'discovery',
        label: 'Discovery & Search',
        icon: Search,
        count: (c) => c.discovery?.shortcuts?.length ?? 0,
      },
      {
        id: 'navigation',
        label: 'Bottom Navigation',
        icon: Sliders,
        count: (c) => c.navigation?.tabs?.length ?? 0,
      },
    ],
  },
  {
    id: 'giving',
    title: 'Donations & Giving',
    description: 'Giving plans, currencies, payment methods, and daily scripture quotes.',
    icon: HeartHandshake,
    badge: (c) => `${c.donate?.plans?.length ?? 0} Plans`,
    subTabs: [
      {
        id: 'donate',
        label: 'Plans & Payment Methods',
        icon: DollarSign,
        count: (c) => c.donate?.plans?.length ?? 0,
      },
      {
        id: 'giving',
        label: 'Scripture Quotes',
        icon: BookOpen,
        count: (c) => c.donate?.scriptures?.length ?? 0,
      },
    ],
  },
  {
    id: 'growth',
    title: 'Community & Growth',
    description: 'Referral milestones, app store reviews, AI intelligence, and ad slots.',
    icon: Users,
    badge: (c) => `${c.referral?.rewardTiers?.length ?? 0} Rewards`,
    subTabs: [
      {
        id: 'referral',
        label: 'Referral Program',
        icon: Users,
        count: (c) => c.referral?.rewardTiers?.length ?? 0,
      },
      {
        id: 'rate',
        label: 'App Store Rating',
        icon: Star,
      },
      {
        id: 'intelligence',
        label: 'AI Intelligence',
        icon: Bot,
      },
      {
        id: 'ads',
        label: 'Ad & Sponsor Slots',
        icon: Megaphone,
        count: (c) => c.monetization?.placements?.length ?? 0,
      },
    ],
  },
  {
    id: 'brand',
    title: 'Brand, Legal & Support',
    description: 'Ministry bio, team leadership, FAQs, support contacts, and privacy.',
    icon: ShieldCheck,
    badge: (c) => `${c.help?.faqs?.length ?? 0} FAQs`,
    subTabs: [
      {
        id: 'about',
        label: 'About ClaudyGod',
        icon: Info,
      },
      {
        id: 'help',
        label: 'Help & FAQs',
        icon: HelpCircle,
        count: (c) => c.help?.faqs?.length ?? 0,
      },
      {
        id: 'privacy',
        label: 'Privacy & Security',
        icon: ShieldCheck,
      },
      {
        id: 'settings',
        label: 'Settings Hub',
        icon: Sliders,
        count: (c) => c.settingsHub?.sections?.length ?? 0,
      },
    ],
  },
];

// Determine initial activeTab and activeCategory from route query
const initialTab = typeof route.query.tab === 'string' && [
  'layout', 'discovery', 'navigation',
  'donate', 'giving',
  'referral', 'rate', 'intelligence', 'ads',
  'about', 'help', 'privacy', 'settings',
].includes(route.query.tab)
  ? (route.query.tab as string)
  : 'layout';

const activeTab = ref<string>(initialTab);

function getCategoryForTab(tab: string): string {
  if (['layout', 'discovery', 'navigation'].includes(tab)) return 'experience';
  if (['donate', 'giving'].includes(tab)) return 'giving';
  if (['referral', 'rate', 'intelligence', 'ads'].includes(tab)) return 'growth';
  return 'brand';
}

const activeCategory = ref<string>(getCategoryForTab(activeTab.value));

const currentCategory = computed(() => {
  return CONFIG_CATEGORIES.find((c) => c.id === activeCategory.value) || CONFIG_CATEGORIES[0];
});

function selectCategory(catId: string): void {
  activeCategory.value = catId;
  const cat = CONFIG_CATEGORIES.find((c) => c.id === catId);
  if (cat && !cat.subTabs.some((s) => s.id === activeTab.value)) {
    setTab(cat.subTabs[0].id);
  }
}

function setTab(tabId: string): void {
  activeTab.value = tabId;
  activeCategory.value = getCategoryForTab(tabId);
  router.replace({ query: { ...route.query, tab: tabId } });
}

// Global Settings Search
const searchQuery = ref('');

interface SearchResultItem {
  id: string;
  tabId: string;
  categoryId: string;
  categoryLabel: string;
  title: string;
  description: string;
  icon: unknown;
}

const ALL_SEARCHABLE_ITEMS: SearchResultItem[] = [
  { id: 'layout', tabId: 'layout', categoryId: 'experience', categoryLabel: 'App Layout', title: 'Home Shelves & Catalog Layout', description: 'Reorder, add, and configure content shelves on the mobile home feed.', icon: Layers },
  { id: 'hero', tabId: 'layout', categoryId: 'experience', categoryLabel: 'App Layout', title: 'Landing Hero Header', description: 'Default title and subtitle shown on the home screen.', icon: Layers },
  { id: 'latest', tabId: 'layout', categoryId: 'experience', categoryLabel: 'App Layout', title: 'Latest Releases & Premieres', description: 'Banner spotlight for new songs and videos.', icon: Sparkles },
  { id: 'discovery', tabId: 'discovery', categoryId: 'experience', categoryLabel: 'App Layout', title: 'Discovery Search & Filters', description: 'Configure content categories and search shortcut pills.', icon: Search },
  { id: 'navigation', tabId: 'navigation', categoryId: 'experience', categoryLabel: 'App Layout', title: 'Bottom Tab Navigation', description: 'Customize dock tab icons and titles.', icon: Sliders },
  { id: 'donate', tabId: 'donate', categoryId: 'giving', categoryLabel: 'Donations', title: 'Giving Plans & Currencies', description: 'Recurring giving tiers, currencies, payment methods, and impact breakdown.', icon: DollarSign },
  { id: 'giving', tabId: 'giving', categoryId: 'giving', categoryLabel: 'Donations', title: 'Giving Scripture Quotes', description: 'Inspirational rotating scripture verses on the donate screen.', icon: BookOpen },
  { id: 'referral', tabId: 'referral', categoryId: 'growth', categoryLabel: 'Growth', title: 'Referral Program & Rewards', description: 'How it works steps and unlocked membership reward milestones.', icon: Users },
  { id: 'rate', tabId: 'rate', categoryId: 'growth', categoryLabel: 'Growth', title: 'App Store Rating URLs', description: 'Apple App Store and Google Play Store review links.', icon: Star },
  { id: 'intelligence', tabId: 'intelligence', categoryId: 'growth', categoryLabel: 'Growth', title: 'AI Assistant & Recommendations', description: 'Configure AI recommendations and assistant parameters.', icon: Bot },
  { id: 'ads', tabId: 'ads', categoryId: 'growth', categoryLabel: 'Growth', title: 'Ad & Sponsor Slots', description: 'Promoted banner slots and sponsored partner placements.', icon: Megaphone },
  { id: 'about', tabId: 'about', categoryId: 'brand', categoryLabel: 'Brand & Legal', title: 'About ClaudyGod & Team', description: 'Ministry mission, version label, hero metrics, and team bios.', icon: Info },
  { id: 'help', tabId: 'help', categoryId: 'brand', categoryLabel: 'Brand & Legal', title: 'Help, Support & FAQs', description: 'Contact options, support center URL, and member FAQs.', icon: HelpCircle },
  { id: 'privacy', tabId: 'privacy', categoryId: 'brand', categoryLabel: 'Brand & Legal', title: 'Privacy Principles & Account Deletion', description: 'Privacy contact email, principles, and deletion confirmation phrase.', icon: ShieldCheck },
  { id: 'settings', tabId: 'settings', categoryId: 'brand', categoryLabel: 'Brand & Legal', title: 'Settings Screen Quick-Access', description: 'Menu sections and link shortcuts on the mobile Settings tab.', icon: Sliders },
];

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return ALL_SEARCHABLE_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.categoryLabel.toLowerCase().includes(q) ||
    item.tabId.toLowerCase().includes(q),
  );
});

function selectSearchResult(res: SearchResultItem): void {
  searchQuery.value = '';
  setTab(res.tabId);
}

function getContentTypeChipClass(ct: MobileContentType): string {
  switch (ct) {
    case 'audio': return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
    case 'video': return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    case 'playlist': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'live': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'announcement': return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    default: return 'bg-surface-hover text-ink-muted border border-border';
  }
}

const previewOpen = ref(false);
const sectionDiagnostics = ref<Record<string, MobileSectionDiagnostic>>({});
const diagnosticLoadingKey = ref<string | null>(null);

const MOBILE_TAB_DESTINATION_OPTIONS_ARR = MOBILE_TAB_DESTINATION_OPTIONS.map((o) => ({ ...o }));
const DISCOVERY_CATEGORY_OPTIONS_ARR = DISCOVERY_CATEGORY_OPTIONS.map((v) => ({ value: v, label: v }));
const AD_PLACEMENT_SCREEN_OPTIONS_ARR = AD_PLACEMENT_SCREEN_OPTIONS.map((o) => ({ ...o }));
const SETTINGS_DESTINATION_OPTIONS_ARR = SETTINGS_DESTINATION_OPTIONS.map((o) => ({ ...o }));
const DONATE_PLAN_PERIOD_OPTIONS_ARR = DONATE_PLAN_PERIOD_OPTIONS.map((o) => ({ ...o }));

const isLoaded = ref(false);
const config = ref<AppConfig>(createDefaultMobileAppConfig());

const categoriesText = computed({
  get: () => config.value.discovery.categories.join(', '),
  set: (v: string) => {
    config.value.discovery.categories = v.split(',').map((c) => c.trim()).filter(Boolean) as AppConfig['discovery']['categories'];
  },
});

const isLoading = computed(() => store.isLoading);
const isSaving = computed(() => store.isSaving);
const configError = computed(() => store.error);

async function onRetry(): Promise<void> {
  await store.fetchAppConfig();
  if (store.appConfig) {
    const cloned = cloneMobileConfig(store.appConfig);
    const allSections = [
      ...(cloned.layout?.homeSections ?? []),
      ...(cloned.layout?.videoSections ?? []),
      ...(cloned.layout?.playerSections ?? []),
      ...(cloned.layout?.librarySections ?? []),
    ];
    for (const s of allSections) {
      if (!s.maxItems || s.maxItems === 6) {
        s.maxItems = 50;
      }
    }
    config.value = cloned;
    isLoaded.value = true;
  }
}

onMounted(async () => {
  await onRetry();
});

function sanitizeConfigBeforeSave(): void {
  if (!config.value) return;

  // 1. Harmonize layout sections sharing an ID across screens to prevent superRefine failures
  const groups = [
    config.value.layout.homeSections,
    config.value.layout.videoSections,
    config.value.layout.playerSections,
    config.value.layout.librarySections,
  ];
  const canon = new Map<string, { title: string; subtitle: string; contentTypes: MobileContentType[] }>();
  for (const s of groups.flat()) {
    s.maxItems = Math.min(100, Math.max(MOBILE_SECTION_RAIL_MIN_ITEMS, Number(s.maxItems) || 50));
    if (!canon.has(s.id)) {
      canon.set(s.id, { title: s.title, subtitle: s.subtitle, contentTypes: [...s.contentTypes] });
    } else {
      const match = canon.get(s.id)!;
      s.title = match.title;
      s.contentTypes = [...match.contentTypes];
    }
  }

  // 2. Filter empty strings in array fields to comply with z.string().min(1)
  if (config.value.donate?.scriptures) {
    config.value.donate.scriptures = config.value.donate.scriptures.map((s) => String(s || '').trim()).filter(Boolean);
    if (!config.value.donate.scriptures.length) config.value.donate.scriptures = ['God loves a cheerful giver.'];
  }
  if (config.value.privacy?.principles) {
    config.value.privacy.principles = config.value.privacy.principles.map((s) => String(s || '').trim()).filter(Boolean);
    if (!config.value.privacy.principles.length) config.value.privacy.principles = ['We do not sell personal data.'];
  }
  if (config.value.donate?.quickAmounts) {
    config.value.donate.quickAmounts = config.value.donate.quickAmounts.map((s) => String(s || '').trim()).filter(Boolean);
    if (!config.value.donate.quickAmounts.length) config.value.donate.quickAmounts = ['$10', '$25', '$50', '$100'];
  }
}

async function onSave(): Promise<void> {
  if (!isLoaded.value) return;
  try {
    sanitizeConfigBeforeSave();
    await store.saveAppConfig(config.value);
    sectionDiagnostics.value = {};
    ui.addToast({ tone: 'success', title: 'Mobile config saved successfully' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: e instanceof Error ? e.message : 'Save failed' });
  }
}

const groupScreen: Record<keyof AppConfig['layout'], 'home' | 'videos' | 'player' | 'library'> = {
  homeSections: 'home',
  videoSections: 'videos',
  playerSections: 'player',
  librarySections: 'library',
};

function diagnosticKey(groupKey: keyof AppConfig['layout'], sectionId: string): string {
  return `${groupKey}:${sectionId}`;
}

async function verifySection(groupKey: keyof AppConfig['layout'], sectionId: string): Promise<void> {
  const key = diagnosticKey(groupKey, sectionId);
  diagnosticLoadingKey.value = key;
  try {
    sectionDiagnostics.value[key] = await getMobileSectionDiagnostic(sectionId, groupScreen[groupKey]);
  } catch (error) {
    ui.addToast({
      tone: 'danger',
      title: error instanceof Error ? error.message : 'Could not verify this section',
    });
  } finally {
    diagnosticLoadingKey.value = null;
  }
}

function sectionDeliverySummary(groupKey: keyof AppConfig['layout'], section: MobileLayoutSection): string {
  const diagnostic = sectionDiagnostics.value[diagnosticKey(groupKey, section.id)];
  if (!diagnostic) return '';
  const shown = Math.min(diagnostic.total, Math.max(MOBILE_SECTION_RAIL_MIN_ITEMS, section.maxItems));
  const paginated = Math.max(0, diagnostic.total - shown);
  return `${diagnostic.total} published · ${shown} in rail · ${paginated} in See all`;
}

function addSection(groupKey: keyof AppConfig['layout']): void {
  if (!config.value) return;
  config.value.layout[groupKey].push(createLayoutSection(groupKey) as unknown as MobileLayoutSection);
}

const hasLatestSectionInHome = computed(() =>
  config.value?.layout?.homeSections?.some((s) => s.id === 'latest-releases') ?? false,
);

function addLatestReleaseSectionToHome(): void {
  if (!config.value) return;
  if (!hasLatestSectionInHome.value) {
    config.value.layout.homeSections.push({
      id: 'latest-releases',
      title: 'Latest Releases & Premieres',
      subtitle: 'New songs, upcoming music videos, and ministry premieres.',
      contentTypes: ['audio', 'video', 'playlist'],
      actionLabel: 'Explore',
      destinationTab: 'home',
      maxItems: 50,
    });
    ui.addToast({ tone: 'success', title: 'Added Latest Releases to Home sections' });
  }
}

function moveSection(groupKey: keyof AppConfig['layout'], fromIdx: number, toIdx: number): void {
  if (!config.value) return;
  const list = config.value.layout[groupKey];
  if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length || fromIdx === toIdx) return;
  const [moved] = list.splice(fromIdx, 1);
  if (moved) {
    list.splice(toIdx, 0, moved);
  }
}

function moveSectionUp(groupKey: keyof AppConfig['layout'], idx: number): void {
  moveSection(groupKey, idx, idx - 1);
}

function moveSectionDown(groupKey: keyof AppConfig['layout'], idx: number): void {
  moveSection(groupKey, idx, idx + 1);
}

function moveSectionToTop(groupKey: keyof AppConfig['layout'], idx: number): void {
  moveSection(groupKey, idx, 0);
}

function moveSectionToBottom(groupKey: keyof AppConfig['layout'], idx: number): void {
  const list = config.value.layout[groupKey];
  if (!list) return;
  moveSection(groupKey, idx, list.length - 1);
}

// Native HTML5 Drag and Drop state & handlers
interface SectionDragState {
  groupKey: keyof AppConfig['layout'] | null;
  fromIndex: number | null;
  overIndex: number | null;
}

const sectionDrag = ref<SectionDragState>({
  groupKey: null,
  fromIndex: null,
  overIndex: null,
});

function handleDragStart(groupKey: keyof AppConfig['layout'], idx: number, event: DragEvent): void {
  sectionDrag.value = { groupKey, fromIndex: idx, overIndex: idx };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${String(groupKey)}:${idx}`);
  }
}

function handleDragOver(groupKey: keyof AppConfig['layout'], idx: number, event: DragEvent): void {
  if (sectionDrag.value.groupKey !== groupKey) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  if (sectionDrag.value.overIndex !== idx) {
    sectionDrag.value.overIndex = idx;
  }
}

function handleDragEnter(groupKey: keyof AppConfig['layout'], idx: number): void {
  if (sectionDrag.value.groupKey !== groupKey) return;
  sectionDrag.value.overIndex = idx;
}

function handleDrop(groupKey: keyof AppConfig['layout'], toIndex: number): void {
  if (
    sectionDrag.value.groupKey === groupKey &&
    sectionDrag.value.fromIndex !== null &&
    sectionDrag.value.fromIndex !== toIndex
  ) {
    moveSection(groupKey, sectionDrag.value.fromIndex, toIndex);
  }
  handleDragEnd();
}

function handleDragEnd(): void {
  sectionDrag.value = {
    groupKey: null,
    fromIndex: null,
    overIndex: null,
  };
}

// Expand / Collapse state per section
const expandedSections = ref<Record<string, boolean>>({});

function isSectionExpanded(sectionId: string): boolean {
  return expandedSections.value[sectionId] !== false;
}

function toggleSectionExpanded(sectionId: string): void {
  expandedSections.value[sectionId] = !isSectionExpanded(sectionId);
}

function expandAllSections(groupKey: keyof AppConfig['layout']): void {
  const list = config.value.layout[groupKey] ?? [];
  for (const s of list) {
    expandedSections.value[s.id] = true;
  }
}

function collapseAllSections(groupKey: keyof AppConfig['layout']): void {
  const list = config.value.layout[groupKey] ?? [];
  for (const s of list) {
    expandedSections.value[s.id] = false;
  }
}

function moveSettingsHubSection(fromIdx: number, toIdx: number): void {
  if (!config.value) return;
  const list = config.value.settingsHub.sections;
  if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length || fromIdx === toIdx) return;
  const [moved] = list.splice(fromIdx, 1);
  if (moved) {
    list.splice(toIdx, 0, moved);
  }
}

function moveSettingsHubItem(sectionIdx: number, fromIdx: number, toIdx: number): void {
  if (!config.value) return;
  const list = config.value.settingsHub.sections[sectionIdx]?.items;
  if (!list || fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length || fromIdx === toIdx) return;
  const [moved] = list.splice(fromIdx, 1);
  if (moved) {
    list.splice(toIdx, 0, moved);
  }
}

function removeSection(groupKey: keyof AppConfig['layout'], idx: number): void {
  config.value?.layout[groupKey].splice(idx, 1);
}

function toggleContentType(section: MobileLayoutSection, ct: MobileContentType): void {
  const idx = section.contentTypes.indexOf(ct);
  if (idx === -1) {
    section.contentTypes.push(ct);
  } else if (section.contentTypes.length > 1) {
    // Schema requires at least one content type — don't let the last one be removed.
    section.contentTypes.splice(idx, 1);
  }
}

function addShortcut(): void {
  config.value?.discovery.shortcuts.push(createDiscoveryShortcut() as unknown as AppConfig['discovery']['shortcuts'][number]);
}

function removeShortcut(i: number): void {
  config.value?.discovery.shortcuts.splice(i, 1);
}

function addPlacement(): void {
  config.value?.monetization.placements.push(createAdPlacement() as unknown as AppConfig['monetization']['placements'][number]);
}

function removePlacement(i: number): void {
  config.value?.monetization.placements.splice(i, 1);
}

function addSettingsHubSection(): void {
  config.value?.settingsHub.sections.push(createSettingsHubSection() as unknown as AppConfig['settingsHub']['sections'][number]);
}

function removeSettingsHubSection(idx: number): void {
  config.value?.settingsHub.sections.splice(idx, 1);
}

function addSettingsHubItem(sectionIdx: number): void {
  config.value?.settingsHub.sections[sectionIdx]?.items.push(createSettingsHubItem() as unknown as SettingsHubItem);
}

function removeSettingsHubItem(sectionIdx: number, itemIdx: number): void {
  config.value?.settingsHub.sections[sectionIdx]?.items.splice(itemIdx, 1);
}

function addReferralStep(): void {
  config.value?.referral.howItWorks.push(createReferralStep() as unknown as ReferralStep);
}

function removeReferralStep(idx: number): void {
  config.value?.referral.howItWorks.splice(idx, 1);
}

function addReferralTier(): void {
  config.value?.referral.rewardTiers.push(createReferralTier() as unknown as ReferralRewardTier);
}

function removeReferralTier(idx: number): void {
  config.value?.referral.rewardTiers.splice(idx, 1);
}

function addScripture(): void {
  config.value?.donate.scriptures.push('');
}

function removeScripture(idx: number): void {
  config.value?.donate.scriptures.splice(idx, 1);
}

function addPrivacyPrinciple(): void {
  config.value?.privacy.principles.push('');
}

function removePrivacyPrinciple(idx: number): void {
  config.value?.privacy.principles.splice(idx, 1);
}

function addHelpContact(): void {
  config.value?.help.contact.push(createHelpContact() as unknown as HelpContact);
}

function removeHelpContact(idx: number): void {
  config.value?.help.contact.splice(idx, 1);
}

function addFaq(): void {
  config.value?.help.faqs.push(createFaq() as unknown as Faq);
}

function removeFaq(idx: number): void {
  config.value?.help.faqs.splice(idx, 1);
}

function addHeroStat(): void {
  config.value?.about.heroStats.push(createHeroStat() as unknown as AppConfig['about']['heroStats'][number]);
}

function removeHeroStat(idx: number): void {
  config.value?.about.heroStats.splice(idx, 1);
}

function addFeatureChip(): void {
  config.value?.about.featureChips.push(createFeatureChip() as unknown as AppConfig['about']['featureChips'][number]);
}

function removeFeatureChip(idx: number): void {
  config.value?.about.featureChips.splice(idx, 1);
}

function addTeamMember(): void {
  config.value?.about.team.push(createTeamMember() as unknown as AppConfig['about']['team'][number]);
}

function removeTeamMember(idx: number): void {
  config.value?.about.team.splice(idx, 1);
}

function ensureCurrencyOptions(): AppConfig['donate']['currencyOptions'] {
  if (!config.value) return undefined;
  if (!config.value.donate.currencyOptions) {
    config.value.donate.currencyOptions = [];
  }
  return config.value.donate.currencyOptions;
}

function addCurrencyOption(): void {
  ensureCurrencyOptions()?.push(createCurrencyOption() as unknown as NonNullable<AppConfig['donate']['currencyOptions']>[number]);
}

function removeCurrencyOption(idx: number): void {
  config.value?.donate.currencyOptions?.splice(idx, 1);
}

function addQuickAmount(): void {
  config.value?.donate.quickAmounts.push('$0');
}

function removeQuickAmount(idx: number): void {
  config.value?.donate.quickAmounts.splice(idx, 1);
}

function ensureQuickAmountsForCurrency(code: string): string[] {
  if (!config.value) return [];
  if (!config.value.donate.quickAmountsByCurrency) {
    config.value.donate.quickAmountsByCurrency = {};
  }
  if (!config.value.donate.quickAmountsByCurrency[code]) {
    config.value.donate.quickAmountsByCurrency[code] = [];
  }
  return config.value.donate.quickAmountsByCurrency[code]!;
}

function addQuickAmountForCurrency(code: string): void {
  ensureQuickAmountsForCurrency(code).push('$0');
}

function removeQuickAmountForCurrency(code: string, idx: number): void {
  config.value?.donate.quickAmountsByCurrency?.[code]?.splice(idx, 1);
}

function addDonateMethod(): void {
  config.value?.donate.methods.push(createDonateMethod() as unknown as DonateMethod);
}

function removeDonateMethod(idx: number): void {
  config.value?.donate.methods.splice(idx, 1);
}

function addDonatePlan(): void {
  config.value?.donate.plans.push(createDonatePlan() as unknown as DonatePlan);
}

function removeDonatePlan(idx: number): void {
  config.value?.donate.plans.splice(idx, 1);
}

function addImpactItem(): void {
  config.value?.donate.impactBreakdown.push(createImpactItem() as unknown as AppConfig['donate']['impactBreakdown'][number]);
}

function removeImpactItem(idx: number): void {
  config.value?.donate.impactBreakdown.splice(idx, 1);
}
</script>
