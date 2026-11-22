package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.List;

public record PregnancySicknessDto(List<Check> checks, List<SicknessPayPartDto> parts, Money total, Money netTotal) {
}
