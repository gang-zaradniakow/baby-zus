import { day } from '@/testing/dates';
import { makeProfile } from '@/testing/profiles';

import { buildTimeline } from './buildTimeline';
import type { TimelineItem } from './TimelineItem';

const today = day(2026, 11, 21);
const ids = (items: TimelineItem[]) => items.map((i) => i.id);
const byId = (items: TimelineItem[], id: string) => items.find((i) => i.id === id);

describe('buildTimeline', () => {
  it('pozycje są posortowane rosnąco po dacie', () => {
    const items = buildTimeline(makeProfile(), today, new Set());
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].date.getTime()).toBeLessThanOrEqual(items[i].date.getTime());
    }
  });

  it('oznacza zadania z listy zrobionych', () => {
    const items = buildTimeline(makeProfile(), today, new Set(['nfz']));
    expect(byId(items, 'nfz')?.status).toBe('done');
  });

  describe('dziecko na świecie', () => {
    it('z umową o pracę: wniosek 81,5% do pracodawcy, ZCNA przez pracodawcę, bez świadczenia rodzicielskiego', () => {
      const items = buildTimeline(makeProfile({ employment: ['uop'] }), today, new Set());
      expect(byId(items, 'w81')?.institution).toBe('PRAC');
      expect(byId(items, 'nfz')?.institution).toBe('PRAC');
      expect(ids(items)).not.toContain('swrodz');
      expect(ids(items)).not.toContain('zua');
    });

    it('z samą firmą: wniosek do ZUS i przypomnienie o ponownym zgłoszeniu ZUS ZUA', () => {
      const items = buildTimeline(makeProfile({ employment: ['jdg'] }), today, new Set());
      expect(byId(items, 'w81')?.institution).toBe('ZUS');
      expect(byId(items, 'nfz')?.institution).toBe('ZUS');
      expect(ids(items)).toContain('zua');
    });

    it('bez ubezpieczenia: świadczenie rodzicielskie zamiast zasiłku', () => {
      const items = buildTimeline(makeProfile({ employment: ['brak'] }), today, new Set());
      expect(ids(items)).toContain('swrodz');
      expect(ids(items)).not.toContain('w81');
      expect(ids(items)).not.toContain('mac-end');
    });

    it('samodzielny rodzic nie widzi pozycji taty', () => {
      const items = buildTimeline(makeProfile({ partner: 'single' }), today, new Set());
      expect(ids(items)).not.toContain('ojcowski');
      expect(ids(items)).not.toContain('tata9');
    });

    it('zgłoszenie w USC 21 dni po urodzeniu jest „wkrótce”, a po miesiącu — po terminie', () => {
      const fresh = buildTimeline(makeProfile({ eventDate: '2026-11-01' }), today, new Set());
      expect(byId(fresh, 'usc')?.status).toBe('now');
      const late = buildTimeline(makeProfile({ eventDate: '2026-10-01' }), today, new Set());
      expect(byId(late, 'usc')?.status).toBe('late');
    });
  });

  describe('ciąża', () => {
    const pregnancy = makeProfile({ stage: 'ciaza', eventDate: '2027-03-15' });

    it('terminy po porodzie są szacunkowe', () => {
      const items = buildTimeline(pregnancy, today, new Set());
      expect(byId(items, 'usc')?.estimate).toBe(true);
      expect(byId(items, '800')?.estimate).toBe(true);
    });

    it('z ubezpieczeniem: urlop przed porodem i decyzja 81,5%', () => {
      expect(ids(buildTimeline(pregnancy, today, new Set()))).toEqual(
        expect.arrayContaining(['mac-przed', 'w81-plan', 'opieka10', 'polozna', 'becikowe']),
      );
    });

    it('urlop przed porodem: na etacie wniosek do pracodawcy, z samą firmą do ZUS', () => {
      expect(byId(buildTimeline(pregnancy, today, new Set()), 'mac-przed')?.institution).toBe('PRAC');
      const selfEmployed = buildTimeline({ ...pregnancy, employment: ['jdg'] }, today, new Set());
      expect(byId(selfEmployed, 'mac-przed')?.institution).toBe('ZUS');
    });

    it('bez ubezpieczenia: brak urlopu, jest świadczenie rodzicielskie', () => {
      const items = buildTimeline({ ...pregnancy, employment: ['brak'] }, today, new Set());
      expect(ids(items)).not.toContain('mac-przed');
      expect(ids(items)).toContain('swrodz');
    });
  });

  describe('adopcja', () => {
    it('wniosek o urlop w ciągu 7 dni od przyjęcia', () => {
      const items = buildTimeline(makeProfile({ stage: 'adopcja', eventDate: '2026-11-18' }), today, new Set());
      const leave = byId(items, 'adop');
      expect(leave?.status).toBe('now');
      expect(leave?.institution).toBe('PRAC');
      expect(ids(items)).toContain('w81a');
    });

    it('bez ubezpieczenia: brak wariantu 81,5%', () => {
      const items = buildTimeline(
        makeProfile({ stage: 'adopcja', eventDate: '2026-11-18', employment: ['brak'] }),
        today,
        new Set(),
      );
      expect(ids(items)).not.toContain('w81a');
    });
  });
});
