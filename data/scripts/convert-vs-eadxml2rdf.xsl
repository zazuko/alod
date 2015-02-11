<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:alod="http://data.alod.ch/alod/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:locah="http://data.archiveshub.ac.uk/def/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <!-- skip unwanted text and attribute nodes -->
    <xsl:template match="text()|@*"></xsl:template>

    <xsl:template match="//archdesc|//c01|//c02|//c03">
        <rdf:Description>
            <xsl:attribute name="rdf:about">
                <xsl:text>http://data.vs.alod.ch/id/archivalressource/</xsl:text>
                <xsl:value-of select="./did/unitid" />
            </xsl:attribute>
            
            <rdf:type rdf:resource="locah:ArchivalResource"/>

            <dc:title>
                <xsl:value-of select="./did/unittitle" />
            </dc:title>

            <xsl:if test="../did/unitid or ../../did/unitid">
                <dc:related>
                    <xsl:attribute name="rdf:resource">
                        <xsl:text>http://data.vs.alod.ch/id/archivalressource/</xsl:text>
                        <xsl:value-of select="../did/unitid" />
                        <xsl:value-of select="../../did/unitid" />
                    </xsl:attribute>
                </dc:related>
            </xsl:if>

            <locah:level>
                <xsl:if test="@otherlevel='Document'">
                    <xsl:attribute name="rdf:resource">
                        <xsl:text>http://data.alod.ch/alod/level/item</xsl:text>
                    </xsl:attribute>
                </xsl:if>
                <xsl:if test="@otherlevel='Dossier'">
                    <xsl:attribute name="rdf:resource">
                        <xsl:text>http://data.alod.ch/alod/level/series</xsl:text>
                    </xsl:attribute>
                </xsl:if>
                <xsl:if test="@otherlevel='Fonds'">
                    <xsl:attribute name="rdf:resource">
                        <xsl:text>http://data.alod.ch/alod/level/fond</xsl:text>
                    </xsl:attribute>
                </xsl:if>

            </locah:level>

            <alod:recordID>
                <xsl:value-of select="./did/unitid" />
            </alod:recordID>
        </rdf:Description>
        <xsl:apply-templates />
    </xsl:template>



    <!-- start at the root and add a wrapper element -->
    <xsl:template match="/">
        <rdf:RDF>
            <xsl:apply-templates />
        </rdf:RDF>
    </xsl:template>
</xsl:stylesheet>
