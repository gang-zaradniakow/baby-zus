package com.hn26.zaradniaki.zusbaby.knowledge.application.dto;

import java.util.List;

public record SupportContactsDto(List<OrganizationDto> organizations, List<HelplineDto> helplines,
        List<LinkDto> links) {
}
