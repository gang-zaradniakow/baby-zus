package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.ArticleLink;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.DictionaryCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Form;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Helpline;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Organization;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.WeekCard;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.WeekCards;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.FormDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.HelplineDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.LinkDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.OrganizationDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.DictionaryDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetFactsQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetFormsQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetSupportContactsQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetWeekCardsQuery;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class DictionaryHandlersTest {

    private static final DictionaryCatalog CATALOG = new DictionaryCatalog() {
        @Override
        public List<Form> forms() {
            return List.of(new Form("Z-3", "Zaświadczenie płatnika"), new Form("ZAM", "Wniosek o zasiłek"));
        }

        @Override
        public List<String> facts() {
            return List.of("Kod B to 100%.", "Tata ma 9 tygodni.");
        }

        @Override
        public List<Organization> organizations() {
            return List.of(new Organization("Fundacja", "Wcześniaki", "https://example.org"),
                    new Organization("Stowarzyszenie", "Strata", null));
        }

        @Override
        public List<Helpline> helplines() {
            return List.of(new Helpline("112", "Numer alarmowy"));
        }

        @Override
        public List<ArticleLink> links() {
            return List.of(new ArticleLink("https://www.zus.pl", "ZUS"));
        }

        @Override
        public WeekCards weekCards() {
            return new WeekCards(List.of(new WeekCard(1, 20, "l4", "Kod B", "100%.")),
                    List.of(new WeekCard(12, null, "opieka", "Choroba", "80%.")));
        }
    };

    private final DictionaryDtoMapper mapper = Mappers.getMapper(DictionaryDtoMapper.class);

    @Test
    void returnsFormsInDisplayOrder() {
        assertThat(new GetFormsHandler(CATALOG, mapper).handle(new GetFormsQuery())).containsExactly(
                new FormDto("Z-3", "Zaświadczenie płatnika"), new FormDto("ZAM", "Wniosek o zasiłek"));
    }

    @Test
    void returnsFacts() {
        assertThat(new GetFactsHandler(CATALOG).handle(new GetFactsQuery())).containsExactly("Kod B to 100%.",
                "Tata ma 9 tygodni.");
    }

    @Test
    void returnsOrganizationsHelplinesAndLinksTogether() {
        var contacts = new GetSupportContactsHandler(CATALOG, mapper).handle(new GetSupportContactsQuery());

        assertThat(contacts.organizations()).containsExactly(
                new OrganizationDto("Fundacja", "Wcześniaki", "https://example.org"),
                new OrganizationDto("Stowarzyszenie", "Strata", null));
        assertThat(contacts.helplines()).containsExactly(new HelplineDto("112", "Numer alarmowy"));
        assertThat(contacts.links()).containsExactly(new LinkDto("https://www.zus.pl", "ZUS"));
    }

    @Test
    void returnsWeekCardsForPregnancyAndChild() {
        var cards = new GetWeekCardsHandler(CATALOG, mapper).handle(new GetWeekCardsQuery());

        assertThat(cards.pregnancy()).containsExactly(new WeekCardDto(1, 20, "l4", "Kod B", "100%."));
        assertThat(cards.child()).containsExactly(new WeekCardDto(12, null, "opieka", "Choroba", "80%."));
    }
}
