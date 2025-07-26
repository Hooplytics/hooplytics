describe('sign up page', () => {
  it('marks required fields invalid and exposes the validationMessage', () => {
    cy.visit('http://localhost:5173/signup');
    cy.get('[data-cy="signup-submit"]').click();

    cy.get('input[required]').each(($input) => {
      expect($input[0].validity.valueMissing).to.be.true;
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });
  });

  // change the values whenever testing for new user
  it("should redirect to profile page when user has inputs in all fields", () => {
    cy.visit('http://localhost:5173/signup');
    cy.get('[data-cy="email"]').type("test@gmail.com")
    cy.get('[data-cy="username"]').type("test name")
    cy.get('[data-cy="password"]').type("testpassword")
    cy.get('[data-cy="signup-submit"]').click();  
    cy.url().should('match', /\/profile$/);
  })

  it("should get an error when trying to sign up an already existing user", () => {
    cy.visit('http://localhost:5173/signup');

    cy.on('window:alert', (text) => {
      expect(text).to.equal('An error occurred signing up.');
    });

    cy.get('[data-cy="email"]').type("test@gmail.com");
    cy.get('[data-cy="username"]').type("test name");
    cy.get('[data-cy="password"]').type("testpassword");
    cy.get('[data-cy="signup-submit"]').click();

    cy.url().should('not.include', '/profile');
  })
});
