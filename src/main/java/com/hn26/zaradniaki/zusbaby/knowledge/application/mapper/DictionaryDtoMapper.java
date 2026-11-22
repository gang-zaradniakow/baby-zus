package com.hn26.zaradniaki.zusbaby.knowledge.application.mapper;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.ArticleLink;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Form;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Helpline;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Organization;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.WeekCards;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.FormDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.SupportContactsDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardsDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.util.List;
import org.mapstruct.Mapper;

/** Dictionaries → query results. */
@Mapper(config = MapStructConfig.class)
public interface DictionaryDtoMapper {

    List<FormDto> toForms(List<Form> forms);

    SupportContactsDto toSupportContacts(List<Organization> organizations, List<Helpline> helplines,
            List<ArticleLink> links);

    WeekCardsDto toDto(WeekCards cards);
}
