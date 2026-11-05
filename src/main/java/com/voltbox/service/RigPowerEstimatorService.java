package com.voltbox.service;

import com.voltbox.entity.Cart;
import com.voltbox.entity.CartItem;
import com.voltbox.model.Product;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Spring Boot domain service for PC Rig Power Supply (PSU) TDP estimation,
 * ATX 3.1 transient spike headroom calculation, automated 4-part Rig Bundle
 * curation, and Studio UI/Background template resolution.
 */
@Service
public class RigPowerEstimatorService {

    public static final int BASE_SYSTEM_OVERHEAD_WATTS = 65;
    public static final double ATX_31_TRANSIENT_HEADROOM_FACTOR = 1.32;

    public static class StudioTemplateSpec {
        public final String id;
        public final String name;
        public final String shortLabel;
        public final String tagline;
        public final String bgHex;
        public final String cardHex;
        public final String accentHex;
        public final String accentSecondaryHex;

        public StudioTemplateSpec(
                String id,
                String name,
                String shortLabel,
                String tagline,
                String bgHex,
                String cardHex,
                String accentHex,
                String accentSecondaryHex) {
            this.id = id;
            this.name = name;
            this.shortLabel = shortLabel;
            this.tagline = tagline;
            this.bgHex = bgHex;
            this.cardHex = cardHex;
            this.accentHex = accentHex;
            this.accentSecondaryHex = accentSecondaryHex;
        }
    }

    private static final Map<String, StudioTemplateSpec> STUDIO_TEMPLATES = Map.of(
            "obsidian", new StudioTemplateSpec(
                    "obsidian", "Obsidian Studio", "Obsidian",
                    "Architectural Carbon & Precision Cyan",
                    "#090d16", "#121826", "#38bdf8", "#2dd4bf"),
            "blueprint", new StudioTemplateSpec(
                    "blueprint", "Cobalt Blueprint", "Blueprint",
                    "CAD Schematic Navy & Royal Cobalt",
                    "#070e1e", "#0f1930", "#60a5fa", "#3b82f6"),
            "copper", new StudioTemplateSpec(
                    "copper", "Anodized Copper", "Copper",
                    "Warm Gunmetal & Brushed Amber Gold",
                    "#110e0c", "#1c1714", "#f59e0b", "#fbbf24"),
            "titanium", new StudioTemplateSpec(
                    "titanium", "Titanium Lab", "Titanium",
                    "Clean Bench Slate & Emerald Telemetry",
                    "#0a1015", "#121c24", "#10b981", "#2dd4bf")
    );

    private final ProductService productService;

    public RigPowerEstimatorService(ProductService productService) {
        this.productService = productService;
    }

    public StudioTemplateSpec resolveStudioThemeTemplate(String rawInput) {
        String key = rawInput != null ? rawInput.trim().toLowerCase(Locale.ROOT) : "";
        if ("blueprint".equals(key) || "overclock".equals(key) || "sapphire".equals(key)) {
            return STUDIO_TEMPLATES.get("blueprint");
        }
        if ("copper".equals(key) || "amber".equals(key) || "gold".equals(key)) {
            return STUDIO_TEMPLATES.get("copper");
        }
        if ("titanium".equals(key) || "cyber".equals(key) || "emerald".equals(key)) {
            return STUDIO_TEMPLATES.get("titanium");
        }
        return STUDIO_TEMPLATES.get("obsidian");
    }

    public int estimateComponentUnitWatts(String componentGroup, String title) {
        String group = componentGroup != null ? componentGroup.trim().toLowerCase(Locale.ROOT) : "";
        String lowerTitle = title != null ? title.trim().toLowerCase(Locale.ROOT) : "";

        switch (group) {
            case "gpus":
                if (lowerTitle.contains("5090") || lowerTitle.contains("4090")) return 450;
                if (lowerTitle.contains("5080") || lowerTitle.contains("4080")) return 320;
                return 250;
            case "cpus":
                if (lowerTitle.contains("ryzen 9") || lowerTitle.contains("i9") || lowerTitle.contains("ultra 9")) return 170;
                if (lowerTitle.contains("ryzen 7") || lowerTitle.contains("i7") || lowerTitle.contains("ultra 7")) return 120;
                return 95;
            case "motherboards":
                return 55;
            case "storage":
                return 12;
            case "gaming":
                return 35;
            case "audio":
                return 10;
            default:
                return 18;
        }
    }

    public Cart.PowerEstimateState estimateSystemPower(List<CartItem> items) {
        int componentsWatts = 0;
        int activeComponentCount = 0;

        if (items != null) {
            for (CartItem item : items) {
                if (item == null || item.getQuantity() <= 0) continue;
                int qty = item.getQuantity();
                activeComponentCount += qty;
                int unitWatts = estimateComponentUnitWatts(item.getComponentGroup(), item.getTitle());
                componentsWatts += unitWatts * qty;
            }
        }

        int baseWatts = activeComponentCount > 0 ? BASE_SYSTEM_OVERHEAD_WATTS : 0;
        int estimatedPeakWatts = activeComponentCount > 0 ? (baseWatts + componentsWatts) : 0;
        int targetWithHeadroom = (int) Math.ceil(estimatedPeakWatts * ATX_31_TRANSIENT_HEADROOM_FACTOR);

        int recommendedPsuWatts;
        String psuTierLabel;
        if (activeComponentCount == 0) {
            recommendedPsuWatts = 650;
            psuTierLabel = "650W ATX 3.1 Ready";
        } else if (targetWithHeadroom <= 550) {
            recommendedPsuWatts = 550;
            psuTierLabel = "550W 80+ Bronze";
        } else if (targetWithHeadroom <= 650) {
            recommendedPsuWatts = 650;
            psuTierLabel = "650W 80+ Gold";
        } else if (targetWithHeadroom <= 750) {
            recommendedPsuWatts = 750;
            psuTierLabel = "750W 80+ Gold";
        } else if (targetWithHeadroom <= 850) {
            recommendedPsuWatts = 850;
            psuTierLabel = "850W ATX 3.1 Gold";
        } else if (targetWithHeadroom <= 1000) {
            recommendedPsuWatts = 1000;
            psuTierLabel = "1000W ATX 3.1 Platinum";
        } else {
            recommendedPsuWatts = 1200;
            psuTierLabel = "1200W ATX 3.1 Titanium";
        }

        int loadPercentage = activeComponentCount == 0
                ? 12
                : Math.min(98, Math.max(15, (int) Math.round((estimatedPeakWatts * 100.0) / recommendedPsuWatts)));

        String headroomStatus = "idle";
        if (activeComponentCount > 0) {
            if (estimatedPeakWatts >= 680) headroomStatus = "high-draw";
            else if (estimatedPeakWatts >= 350) headroomStatus = "balanced";
            else headroomStatus = "optimal";
        }

        Cart.PowerEstimateState state = new Cart.PowerEstimateState();
        state.baseSystemWatts = baseWatts;
        state.componentsWatts = componentsWatts;
        state.estimatedPeakWatts = estimatedPeakWatts;
        state.recommendedPsuWatts = recommendedPsuWatts;
        state.psuTierLabel = psuTierLabel;
        state.loadPercentage = loadPercentage;
        state.headroomStatus = headroomStatus;
        state.activeComponentCount = activeComponentCount;
        state.thermalBtuPerHour = (int) Math.round(estimatedPeakWatts * 3.412);
        return state;
    }

    /**
     * Selects a balanced 4-part Starter Rig (GPU + CPU + Motherboard + Storage)
     * from active in-stock catalog products to unlock the 5% Rig Bundle discount.
     */
    public List<Product> recommendStarterRigBundle(List<Product> catalog) {
        if (catalog == null || catalog.isEmpty()) return Collections.emptyList();
        String[] requiredGroups = {"gpus", "cpus", "motherboards", "storage"};
        List<Product> selected = new ArrayList<>(4);

        for (String group : requiredGroups) {
            Product best = catalog.stream()
                    .filter(p -> p != null && !p.takenDown && productService.resolveQuantity(p) > 0)
                    .filter(p -> group.equalsIgnoreCase(productService.classifyComponentGroup(p)))
                    .max(Comparator.comparingDouble((Product p) -> p.ratingRate)
                            .thenComparingDouble(p -> -p.price))
                    .orElse(null);
            if (best != null) {
                selected.add(best);
            }
        }
        return selected;
    }
}
