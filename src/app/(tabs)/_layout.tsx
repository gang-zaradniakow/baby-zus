import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { NavBarItem } from '@/components/molecules/NavBarItem';
import { NavBar } from '@/components/organisms/NavBar';
import { TABS } from '@/navigation/tabs';
import { tabsLayoutStyles } from '@/navigation/tabsLayout.styles';

/** Łączy routing zakładek (expo-router) z naszym wyglądem paska (NavBar + NavBarItem). */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={tabsLayoutStyles.slot} />
      <TabList asChild>
        <NavBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <NavBarItem tab={tab} />
            </TabTrigger>
          ))}
        </NavBar>
      </TabList>
    </Tabs>
  );
}
