Feature: About
  As a Data Packager or Data Consumer
  I want to know the version of the application
  So that I can inform the Maintainer about issues I experience using a version of the application

  As a Sponsor, Contributor or Maintainer of the application
  I want to see acknowledgement of my contribution
  So that I can confirm that licencing requirements or other obligations have been met

  The About command can be invoked using a menu item

  Scenario: Show the About panel
    Given I have opened Data Curator
    When I invoke the "About" command
    Then the Contributor names
    And Major Contributor logos
    And attribution statements
    And links to external websites
    And the Application logo
    And the Application name
    And the Application version, are shown

  Scenario: Close the About panel
    Given I have opened Data Curator
    And I have displayed the About panel
    When I click the "Close" button on the About panel
    Then the About panel closes
