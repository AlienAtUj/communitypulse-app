
import test from "node:test";
import assert from "node:assert/strict";

import {
  SEED_INCIDENTS,
  SEED_RESOURCES,
  SEED_SCHEDULED_OUTAGES,
  sortIncidents,
  filterIncidentsByTab,
  filterIncidentsByHazard,
  groupIncidentsByLocation,
  filterResourcesByCategory,
  getAggregatedNeeds,
  NgoOffer,
} from "./data";

test("sortIncidents orders by priority (critical > high > medium) then time descending", () => {
  const sorted = sortIncidents(SEED_INCIDENTS);

  assert.equal(sorted[0].id, "INC-006");
  assert.equal(sorted[1].id, "INC-005");
  assert.equal(sorted[2].id, "INC-001");
});

test("filterIncidentsByTab separates active and resolved incidents and applies hazard filter", () => {
  const active = filterIncidentsByTab(SEED_INCIDENTS, "active");
  assert.equal(active.length, 6);

  const infraActive = filterIncidentsByTab(
    SEED_INCIDENTS,
    "active",
    "infrastructure"
  );
  assert.equal(infraActive.length, 3);

  const floodActive = filterIncidentsByTab(
    SEED_INCIDENTS,
    "active",
    "flood"
  );
  assert.equal(floodActive.length, 1);
  assert.equal(floodActive[0].id, "INC-005");

  const fireActive = filterIncidentsByTab(
    SEED_INCIDENTS,
    "active",
    "fire"
  );
  assert.equal(fireActive.length, 1);
  assert.equal(fireActive[0].id, "INC-006");
});

test("filterIncidentsByHazard filters by specific hazard and infrastructure composite", () => {
  assert.equal(
    filterIncidentsByHazard(SEED_INCIDENTS, "all").length,
    6
  );

  assert.equal(
    filterIncidentsByHazard(SEED_INCIDENTS, "infrastructure").length,
    3
  );

  assert.equal(
    filterIncidentsByHazard(SEED_INCIDENTS, "flood").length,
    1
  );

  assert.equal(
    filterIncidentsByHazard(SEED_INCIDENTS, "fire").length,
    1
  );
});

test("SEED_SCHEDULED_OUTAGES includes both electricity and water outages for upcoming days", () => {
  assert.ok(SEED_SCHEDULED_OUTAGES.length >= 4);

  const hasPower = SEED_SCHEDULED_OUTAGES.some(
    (outage) => outage.type === "power"
  );

  const hasWater = SEED_SCHEDULED_OUTAGES.some(
    (outage) => outage.type === "water"
  );

  const hasToday = SEED_SCHEDULED_OUTAGES.some(
    (outage) => outage.day === "Today" && outage.reminderSet
  );

  assert.equal(hasPower, true);
  assert.equal(hasWater, true);
  assert.equal(hasToday, true);
});

test("groupIncidentsByLocation aggregates reporter counts and formats summary text", () => {
  const groups = groupIncidentsByLocation(SEED_INCIDENTS);

  assert.ok(groups.length >= 5);

  const sectionA = groups.find(
    (group) => group.location === "Section A, Ward 8"
  );

  assert.ok(sectionA);

  assert.equal(sectionA.totalReporters, 3);

  assert.equal(
    sectionA.summaryText,
    "3 people from Section A, Ward 8 reported flooding"
  );
});

test("filterResourcesByCategory filters correctly", () => {
  assert.equal(
    filterResourcesByCategory(SEED_RESOURCES, "all").length,
    5
  );

  assert.equal(
    filterResourcesByCategory(SEED_RESOURCES, "water").length,
    1
  );

  assert.equal(
    filterResourcesByCategory(SEED_RESOURCES, "water")[0].id,
    "RES-001"
  );

  assert.equal(
    filterResourcesByCategory(SEED_RESOURCES, "clinic").length,
    1
  );
});

test("getAggregatedNeeds aggregates active incidents and marks matching offers", () => {
  const offers: NgoOffer[] = [
    {
      id: "offer-water-1",
      type: "water",
      ngoName: "Water Relief NGO",
      provide: "Water tanker, 500L",
      quantity: "1",
      eta: "Within 2 hours",
    },
  ];

  const needs = getAggregatedNeeds(SEED_INCIDENTS, offers);

  const waterNeed = needs.find((need) => need.type === "water");

  assert.ok(waterNeed);
  assert.equal(waterNeed.households, 36);
  assert.equal(waterNeed.offerSent, true);
  assert.equal(waterNeed.offers.length, 1);
  assert.equal(waterNeed.offers[0].ngoName, "Water Relief NGO");
});

test("multiple NGOs can offer help for the same incident type", () => {
  const offers: NgoOffer[] = [
    {
      id: "offer-water-1",
      type: "water",
      ngoName: "Water Relief NGO",
      provide: "Water tanker",
      quantity: "500 litres",
      eta: "Within 2 hours",
    },
    {
      id: "offer-water-2",
      type: "water",
      ngoName: "Community Support NGO",
      provide: "Bottled water",
      quantity: "200 bottles",
      eta: "Within 1 hour",
    },
  ];

  const needs = getAggregatedNeeds(SEED_INCIDENTS, offers);

  const waterNeed = needs.find((need) => need.type === "water");

  assert.ok(waterNeed);
  assert.equal(waterNeed.offerSent, true);
  assert.equal(waterNeed.offers.length, 2);

  assert.equal(waterNeed.offers[0].ngoName, "Water Relief NGO");
  assert.equal(
    waterNeed.offers[1].ngoName,
    "Community Support NGO"
  );
});

test("getAggregatedNeeds returns no offers when none match an incident type", () => {
  const offers: NgoOffer[] = [];

  const needs = getAggregatedNeeds(SEED_INCIDENTS, offers);

  const waterNeed = needs.find((need) => need.type === "water");

  assert.ok(waterNeed);
  assert.equal(waterNeed.offerSent, false);
  assert.equal(waterNeed.offers.length, 0);
  assert.equal(waterNeed.offerDetails, undefined);
});
