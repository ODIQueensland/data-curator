Feature: Copy
  As a Data Packager
  I want to copy data to the clipboard
  So that I can paste the data elsewhere in the application or into another application

  Rules:
    - Selected data can be some or all of the data in a cell, or one or more cells (e.g. row(s), column(s) or block of cells)
    - The "Copy" command can be invoked using a menu item or keyboard shortcut

  Scenario: Copy data
    Given I have selected some data
    When I invoke the "Copy" command
    Then copy the data to the clipboard for use in the "Paste" command
