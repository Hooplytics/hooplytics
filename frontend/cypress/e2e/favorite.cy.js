describe('verifying favorite and unfavorite functionality', () => {
  beforeEach(() => {
    // Log in and land on /home…
    cy.visit('http://localhost:5173/login');
    cy.get('[data-cy="email"]').type('email2@gmail.com');
    cy.get('[data-cy="password"]').type('password2');
    cy.get('[data-cy="login-submit"]').click();
    cy.url().should('include', '/profile');
    cy.visit('http://localhost:5173/home');

    cy.intercept(
      { method: 'GET', url: '**/search/players*player=shai*' },
      { fixture: 'players-sga.json' }
    ).as('getSGA');

    cy.get('[data-cy="search"]').clear().type('shai{enter}');
    cy.wait('@getSGA');
    cy.contains('h5', 'Shai Gilgeous-Alexander').should('be.visible');
  });

  it('verifies that favorite and unfavorite functionality works', () => {
    cy.contains('h5', 'Shai Gilgeous-Alexander')
      .parent('div.search-card')
      .as('sgaCard')
      .trigger('mouseover');

    cy.get('@sgaCard')
      .find('[data-cy="favorite"]')
      .click({ force: true });

    cy.get('@sgaCard')
      .find('img.active')
      .should('exist');
    
    cy.get('@sgaCard')
      .find('[data-cy="favorite"]')
      .click({ force: true });

    cy.get('@sgaCard')
      .find('img.card-heart.active')
      .should('not.exist');
  });
})