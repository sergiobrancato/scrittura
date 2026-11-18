import { useEffect, useState } from 'react';
import { StoriesProvider, useStories } from './lib/store';
import { ThemeProvider } from './lib/theme';
import { AppLogo, Button } from './components/ui';
import { Icon } from './components/Icon';
import { HomeView } from './views/HomeView';
import { StoryWorkspace } from './views/StoryWorkspace';

type Route = { name: 'home' } | { name: 'story'; storyId: string };

function AppContent() {
  const { stories, ready, initError } = useStories();
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const activeStory =
    route.name === 'story' ? stories.find((story) => story.id === route.storyId) : null;

  useEffect(() => {
    if (activeStory) {
      document.title = `${activeStory.title} — Scrittura`;
    } else {
      document.title = 'Scrittura — Bottega di storie';
    }
  }, [activeStory]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <AppLogo size={68} />
        <p className="mt-5 font-serif text-2xl tracking-tight text-ink">Scrittura</p>
        <p className="mt-1 text-[10.5px] uppercase tracking-[0.22em] text-ink-faint">
          Bottega di storie
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm text-ink-soft">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
          Apertura della biblioteca...
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <AppLogo size={58} />
        <h1 className="mt-5 font-serif text-2xl text-ink">Qualcosa non ha funzionato</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{initError}</p>
        <Button variant="primary" className="mt-5" onClick={() => window.location.reload()}>
          <Icon name="restore" size={15} />
          Ricarica l'applicazione
        </Button>
      </div>
    );
  }

  if (route.name === 'story') {
    return (
      <StoryWorkspace
        key={route.storyId}
        storyId={route.storyId}
        onBack={() => setRoute({ name: 'home' })}
      />
    );
  }

  return <HomeView onOpenStory={(storyId) => setRoute({ name: 'story', storyId })} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <StoriesProvider>
        <AppContent />
      </StoriesProvider>
    </ThemeProvider>
  );
}
